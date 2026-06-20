import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import {
  renderWithProviders,
  authedAdmin,
} from "../../test/renderWithProviders";
import * as fx from "../../test/fixtures";

// Single chokepoint: the api client. useApi reads + adminApi mutations both call apiFetch.
vi.mock("../../api/client", () => ({
  apiFetch: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
// Mock the WS hook so no real socket opens; report a 'live' connection.
vi.mock("../../features/support/useSupportSocket", () => ({
  useSupportSocket: () => "live",
}));

import { apiFetch } from "../../api/client";
import SupportTicketDetailPage from "./SupportTicketDetailPage";

const mockFetch = vi.mocked(apiFetch);

function renderDetail() {
  return renderWithProviders(<SupportTicketDetailPage />, {
    preloadedState: authedAdmin(),
    routePath: "/support/:id",
    initialEntries: ["/support/t1"],
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("SupportTicketDetailPage", () => {
  it("renders the thread message and a Live chip, with the reply box for an OPEN ticket", async () => {
    mockFetch.mockResolvedValue(fx.ticketDetail());

    renderDetail();

    // (1) the thread message content renders (chatMessage default content)
    expect(
      await screen.findByText("My drone never arrived"),
    ).toBeInTheDocument();

    // (2) a "Live" status chip renders (the WS hook returned 'live' -> "● Live")
    expect(screen.getByText(/Live/i)).toBeInTheDocument();

    // (3) OPEN ticket: reply field + Send button are present and the field is enabled
    const replyField = screen.getByLabelText(/Reply as agent/i);
    expect(replyField).toBeInTheDocument();

    const sendButton = screen.getByRole("button", { name: /Send reply/i });
    expect(sendButton).toBeInTheDocument();
    // Empty reply -> Send is disabled (guards the empty-content submit).
    expect(sendButton).toBeDisabled();
  });

  it('replaces the reply box with a "closed" notice (no Send button) for a CLOSED ticket', async () => {
    mockFetch.mockResolvedValue(fx.ticketDetail({ status: "CLOSED" }));

    renderDetail();

    // The thread still renders (proves the page loaded the CLOSED ticket).
    expect(
      await screen.findByText("My drone never arrived"),
    ).toBeInTheDocument();

    // (4a) the "closed" notice replaces the reply box.
    // (/closed/i alone is ambiguous — the status chip also reads "Closed" — so match the
    // notice sentence specifically.)
    expect(screen.getByText(/this ticket is closed/i)).toBeInTheDocument();

    // (4b) no reply field and no Send button
    expect(screen.queryByLabelText(/Reply as agent/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Send reply/i }),
    ).not.toBeInTheDocument();
  });
});
