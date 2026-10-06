import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import ArsipList from "./ArsipList";

const DAYS = 250;

function OpenedDay() {
  return <p>opened day {useParams().num}</p>;
}

async function renderArchive() {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter initialEntries={["/arsip"]}>
        <Routes>
          <Route path="/arsip" element={<ArsipList />} />
          <Route path="/arsip/:num" element={<OpenedDay />} />
        </Routes>
      </MemoryRouter>
    </SWRConfig>
  );
  return screen.findByLabelText("Lompat ke hari") as Promise<HTMLInputElement>;
}

function openedDays() {
  return screen
    .queryAllByRole("link")
    .map((link) => link.getAttribute("href"))
    .filter((href) => href?.startsWith("/arsip/"));
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    async () => new Response(JSON.stringify({ nums: DAYS }))
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("jumping to a day", () => {
  test.each(["1", String(DAYS)])("day %s opens", async (day) => {
    const input = await renderArchive();

    fireEvent.change(input, { target: { value: day } });
    fireEvent.click(screen.getByText("Buka"));

    expect(screen.getByText(`opened day ${day}`)).toBeTruthy();
  });

  // today is not in the archive, so the form must refuse it instead of
  // sending people to a day that does not exist yet
  test.each(["", "0", "-3", String(DAYS + 1), "1.5"])(
    "%j is refused with a hint and stays on the archive",
    async (day) => {
      const input = await renderArchive();

      fireEvent.change(input, { target: { value: day } });
      fireEvent.click(screen.getByText("Buka"));

      expect(
        screen.getByText(`Masukkan angka antara 1 sampai ${DAYS}`)
      ).toBeTruthy();
      expect(screen.queryByText(/opened day/)).toBeNull();
    }
  );

  test("the hint goes away once the number changes", async () => {
    const input = await renderArchive();

    fireEvent.click(screen.getByText("Buka"));
    fireEvent.change(input, { target: { value: "5" } });

    expect(screen.queryByText(/Masukkan angka/)).toBeNull();
  });
});

describe("browsing all days", () => {
  test("opens on the newest days and lists the latest ones first", async () => {
    await renderArchive();

    const days = openedDays();
    expect(days).toContain(`/arsip/${DAYS}`);
    // the "Terbaru" chips and the newest range both show the latest days
    expect(days).toContain(`/arsip/${DAYS - 6}`);
    expect(days).not.toContain("/arsip/1");
  });

  test("every day is reachable from exactly one range", async () => {
    await renderArchive();

    const ranges = screen
      .getAllByRole("button")
      .map((button) => button.textContent ?? "")
      .filter((text) => /^\d+-\d+$/.test(text));
    expect(ranges).toEqual(["1-100", "101-200", "201-250"]);

    const reached: number[] = [];
    for (const range of ranges) {
      fireEvent.click(screen.getByText(range));

      // the grid sits right below the "Hari ke-x sampai y" caption
      const grid = screen.getByText(/^Hari ke-/).nextElementSibling!;
      const days = [...grid.querySelectorAll("a")].map((link) =>
        Number(link.getAttribute("href")!.split("/")[2])
      );

      const [from, to] = range.split("-").map(Number);
      // exactly the range: no gap, no overflow into the next one
      expect(days).toEqual(
        Array.from({ length: to - from + 1 }, (_, i) => from + i)
      );
      reached.push(...days);
    }

    expect(reached).toHaveLength(DAYS);
  });
});
