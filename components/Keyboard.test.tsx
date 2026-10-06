import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { encode } from "../utils/codec";
import { initialState } from "../utils/game";
import Keyboard from "./Keyboard";

function renderKeyboard() {
  render(
    <Keyboard
      onPressChar={() => {}}
      onBackspace={() => {}}
      onSubmit={() => {}}
      gameState={initialState}
      hash={encode("godok")}
      isAnimating={{ current: false }}
    />
  );
}

function key(type: "keydown" | "keyup", init: KeyboardEventInit) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent(type, { bubbles: true, ...init }));
  });
}

const pressedKeys = () =>
  screen
    .getAllByRole("button")
    .filter((button) => button.dataset.pressed === "true")
    .map((button) => button.textContent || "backspace");

afterEach(cleanup);

describe("on-screen keys follow the physical keyboard", () => {
  test("a held key looks pressed until it is released", async () => {
    renderKeyboard();

    key("keydown", { key: "q" });
    expect(pressedKeys()).toEqual(["q"]);

    key("keyup", { key: "q" });
    await waitFor(() => expect(pressedKeys()).toEqual([]));
  });

  // a tap is over in a few milliseconds, which no one would ever see
  test("a quick tap stays visibly pressed for a moment", async () => {
    renderKeyboard();

    key("keydown", { key: "w" });
    key("keyup", { key: "w" });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(pressedKeys()).toEqual(["w"]);

    await waitFor(() => expect(pressedKeys()).toEqual([]));
  });

  test("capital letters press the same key", () => {
    renderKeyboard();

    key("keydown", { key: "Q", shiftKey: true });

    expect(pressedKeys()).toEqual(["q"]);
  });

  test("overlapping keys are tracked separately", async () => {
    renderKeyboard();

    key("keydown", { key: "a" });
    key("keydown", { key: "s" });
    key("keyup", { key: "a" });

    expect(pressedKeys().sort()).toEqual(["a", "s"]);
    await waitFor(() => expect(pressedKeys()).toEqual(["s"]));
  });

  test.each([
    ["Enter", "Enter"],
    ["_", "_"],
    ["Backspace", "backspace"],
  ])("%s presses its own key", (eventKey, label) => {
    renderKeyboard();

    key("keydown", { key: eventKey });

    expect(pressedKeys()).toEqual([label]);
  });

  test.each([
    ["a browser shortcut", { key: "r", metaKey: true }],
    ["a key that is not on the keyboard", { key: "Tab" }],
    ["a modifier on its own", { key: "Shift", shiftKey: true }],
  ])("%s presses nothing", (_, init) => {
    renderKeyboard();

    key("keydown", init);

    expect(pressedKeys()).toEqual([]);
  });

  // the keyup never arrives when the window loses focus mid press
  test("keys are released when the window loses focus", () => {
    renderKeyboard();
    key("keydown", { key: "k" });

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(pressedKeys()).toEqual([]);
  });
});
