import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

// next/navigation の useRouter を Next.js App Router 外でもテストできるようモック
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

test("App", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
});
