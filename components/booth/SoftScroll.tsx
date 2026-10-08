"use client";

import { useRef, type ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
};

function overflowing(el: HTMLElement) {
  return el.scrollHeight > el.clientHeight + 1;
}

function atEdge(el: HTMLElement, deltaY: number) {
  const top = el.scrollTop <= 1;
  const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
  return (deltaY < 0 && top) || (deltaY > 0 && bottom);
}

function releaseScroll(from: HTMLElement, deltaY: number) {
  let node = from.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const nested =
      (style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1;
    if (nested) {
      node.scrollTop += deltaY;
      return;
    }
    node = node.parentElement;
  }
  const root = document.scrollingElement;
  if (root) root.scrollTop += deltaY;
  else window.scrollBy(0, deltaY);
}

export function SoftScroll({ className, children }: Props) {
  const hide = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const wheelBound = useRef<HTMLDivElement | null>(null);

  const placeThumb = (el: HTMLElement) => {
    const bit = thumb.current;
    if (!bit) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      bit.style.height = "0px";
      return;
    }
    const size = Math.max(28, (clientHeight / scrollHeight) * clientHeight);
    const maxTop = clientHeight - size;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop;
    bit.style.height = `${size}px`;
    bit.style.transform = `translateY(${top}px)`;
  };

  const flashBar = (el: HTMLElement) => {
    const shell = wrap.current;
    if (!shell) return;
    if (!overflowing(el)) {
      shell.classList.remove("is-scrolling");
      return;
    }
    placeThumb(el);
    shell.classList.add("is-scrolling");
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => shell.classList.remove("is-scrolling"), 900);
  };

  const bind = (node: HTMLDivElement | null) => {
    if (wheelBound.current) wheelBound.current.onwheel = null;
    wheelBound.current = node;
    body.current = node;
    if (!node) return;
    node.onwheel = (event: WheelEvent) => {
      if (atEdge(node, event.deltaY)) {
        event.preventDefault();
        releaseScroll(node, event.deltaY);
        return;
      }
      flashBar(node);
    };
  };

  return (
    <div ref={wrap} className={`soft-scroll ${className ?? ""}`.trim()}>
      <div
        ref={bind}
        className="soft-scroll-body"
        onScroll={(event) => flashBar(event.currentTarget)}
      >
        {children}
      </div>
      <div className="soft-scroll-rail" aria-hidden>
        <div ref={thumb} className="soft-scroll-thumb" />
      </div>
    </div>
  );
}
