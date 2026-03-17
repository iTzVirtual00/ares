/* @refresh reload */
import './index.css';
import { render } from 'solid-js/web';
import App from './App';
import { WasmInterface } from './core/RiscV';
import { Emulator, TestData } from './core/EmulatorState';
import wasmUrl from "./main.wasm?url";

const root = document.getElementById('root');

export async function fetchTestData(): Promise<TestData | null> {
  const testsuiteName = new URLSearchParams(window.location.search).get(
    "testsuite",
  );
  if (!testsuiteName) return null;

  const [asmRes, jsonRes, txtRes] = await Promise.all([
    fetch(`${testsuiteName}.S`),
    fetch(`${testsuiteName}.json`),
    fetch(`${testsuiteName}.txt`),
  ]);

  if (!asmRes.ok || !jsonRes.ok || !txtRes.ok) {
    throw new Error("Failed to load test suite files");
  }

  return {
    testPrefix: await asmRes.text(),
    testcases: await jsonRes.json(),
    assignment: (await txtRes.text()).trim(),
  };
}

// SAFETY: wasmInterface is only accessed by App, which is called after
export let wasmInterface!: WasmInterface;
export let emulator!: Emulator;
export let testData!: TestData;
(async () => {
  const res = await fetch(wasmUrl);
  const buffer = await res.arrayBuffer();
  let wi = WasmInterface.loadModule(buffer);
  let tc = fetchTestData();
  wasmInterface = await wi;
  testData = (await tc)!;
  emulator = new Emulator(wasmInterface, testData);
  render(() => <App />, root!);
})();