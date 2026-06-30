import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

// 공용 Input은 props를 그대로 흘려보내야 폼 어디서든 신뢰하고 씁니다.
describe("Input", () => {
  it("placeholder 등 받은 props를 실제 input에 전달한다", () => {
    render(<Input placeholder="이메일을 입력하세요" />);
    expect(screen.getByPlaceholderText("이메일을 입력하세요")).toBeInTheDocument();
  });

  it("사용자가 타이핑한 값이 입력된다", async () => {
    render(<Input placeholder="검색" />);
    const input = screen.getByPlaceholderText("검색");
    await userEvent.type(input, "노트북");
    expect(input).toHaveValue("노트북");
  });

  it("disabled를 주면 입력이 막힌다", () => {
    render(<Input placeholder="검색" disabled />);
    expect(screen.getByPlaceholderText("검색")).toBeDisabled();
  });
});
