import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase クライアントをモック化
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn();

vi.mock('../client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// テスト実行前にモックのチェーンを設定
beforeEach(() => {
  vi.clearAllMocks();
  mockOrder.mockResolvedValue({ data: null, error: null });
  mockSelect.mockReturnValue({ order: mockOrder });
  mockUpsert.mockResolvedValue({ data: null, error: null });
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert });
});

// 動的インポートでモック後にモジュールを読み込む
const { fetchGames, upsertGame } = await import('./games');

describe('fetchGames', () => {
  it('Supabase から試合一覧を取得して Game 型に変換する', async () => {
    const mockRow = {
      id: 'game-1',
      user_id: 'user-1',
      team_id: 'team-1',
      date: '2026-02-17',
      venue: '東京ドーム',
      home_team_name: '巨人',
      away_team_name: '阪神',
      status: 'in_progress' as const,
      created_at: '2026-02-17T00:00:00Z',
      updated_at: '2026-02-17T00:00:00Z',
    };
    mockOrder.mockResolvedValue({ data: [mockRow], error: null });

    const result = await fetchGames();

    expect(mockFrom).toHaveBeenCalledWith('games');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'game-1',
      userId: 'user-1',
      teamId: 'team-1',
      date: '2026-02-17',
      venue: '東京ドーム',
      homeTeamName: '巨人',
      awayTeamName: '阪神',
      status: 'in_progress',
      createdAt: '2026-02-17T00:00:00Z',
      updatedAt: '2026-02-17T00:00:00Z',
    });
  });

  it('Supabase エラー時は例外を投げる', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB Error') });

    await expect(fetchGames()).rejects.toThrow('DB Error');
  });

  it('データが null の場合は空配列を返す', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await fetchGames();
    expect(result).toEqual([]);
  });

  it('venue が null の場合は undefined に変換する', async () => {
    const mockRow = {
      id: 'game-2',
      user_id: 'user-1',
      team_id: null,
      date: '2026-02-17',
      venue: null,
      home_team_name: '巨人',
      away_team_name: '阪神',
      status: 'completed' as const,
      created_at: '2026-02-17T00:00:00Z',
      updated_at: '2026-02-17T00:00:00Z',
    };
    mockOrder.mockResolvedValue({ data: [mockRow], error: null });

    const result = await fetchGames();
    expect(result[0].venue).toBeUndefined();
    expect(result[0].teamId).toBeUndefined();
  });
});

describe('upsertGame', () => {
  it('試合データを Supabase にアップサートする（team_id あり）', async () => {
    await upsertGame({
      id: 'game-1',
      userId: 'user-1',
      teamId: 'team-1',
      date: '2026-02-17',
      venue: '東京ドーム',
      homeTeamName: '巨人',
      awayTeamName: '阪神',
      status: 'in_progress',
      createdAt: '2026-02-17T00:00:00Z',
      updatedAt: '2026-02-17T00:00:00Z',
    });

    expect(mockFrom).toHaveBeenCalledWith('games');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'game-1',
        user_id: 'user-1',
        team_id: 'team-1',
        home_team_name: '巨人',
        away_team_name: '阪神',
      })
    );
  });

  it('試合データを Supabase にアップサートする（team_id なし）', async () => {
    await upsertGame({
      id: 'game-1',
      userId: 'user-1',
      date: '2026-02-17',
      homeTeamName: '巨人',
      awayTeamName: '阪神',
      status: 'in_progress',
      createdAt: '2026-02-17T00:00:00Z',
      updatedAt: '2026-02-17T00:00:00Z',
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: null,
      })
    );
  });

  it('Supabase エラー時は例外を投げる', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('Upsert Error') });

    await expect(upsertGame({
      id: 'game-1',
      userId: 'user-1',
      date: '2026-02-17',
      homeTeamName: '巨人',
      awayTeamName: '阪神',
      status: 'in_progress',
      createdAt: '2026-02-17T00:00:00Z',
      updatedAt: '2026-02-17T00:00:00Z',
    })).rejects.toThrow('Upsert Error');
  });
});
