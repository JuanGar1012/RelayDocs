import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders auth entry screen by default", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("Sign in to RelayDocs")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Login" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });
});
