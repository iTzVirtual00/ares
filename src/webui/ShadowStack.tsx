import { Component, For } from "solid-js";
import { ShadowStackEntry } from "./core/EmulatorState";

export const ShadowStack: Component<{ memWrittenAddr: number, memWrittenLen: number, shadowStack: ShadowStackEntry[] }> = (props) =>
    <For each={props.shadowStack}>
        {(elem) => (
            <div class="flex flex-col pb-4">
                <div class="font-bold">{elem.name}</div>
                <For each={elem.elems}>
                    {(e) => (
                        <div class="flex flex-row">
                            <a class="theme-style6 pr-2 w-[10ch] tabular-nums">{e.addr.toString(16)}</a>
                            <div class={((e.addr >= props.memWrittenAddr &&
                                e.addr <
                                props.memWrittenAddr +
                                props.memWrittenLen) ? "animate-fade-highlight " : "") + "tabular-nums"}>{e.text}</div>
                        </div>
                    )}
                </For>
            </div >
        )}
    </For >; 