'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number>(width || 0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number>(currentWidth);

  // Keep ref in sync with state
  useEffect(() => {
    widthRef.current = currentWidth;
  }, [currentWidth]);

  // Get natural width on load if no width set
  const handleLoad = useCallback(() => {
    if (!currentWidth && imgRef.current) {
      const natural = imgRef.current.naturalWidth;
      const container = containerRef.current?.parentElement;
      const maxW = container ? container.clientWidth - 32 : 600;
      const w = Math.min(natural, maxW);
      setCurrentWidth(w);
      updateAttributes({ width: w });
    }
  }, [currentWidth, updateAttributes]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = currentWidth || (imgRef.current?.offsetWidth ?? 400);

    const handleMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const container = containerRef.current?.parentElement;
      const maxW = container ? container.clientWidth - 32 : 800;
      const newWidth = Math.max(100, Math.min(startWidth + delta, maxW));
      setCurrentWidth(newWidth);
      widthRef.current = newWidth;
    };

    const handleUp = () => {
      setIsResizing(false);
      updateAttributes({ width: widthRef.current });
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [currentWidth, updateAttributes]);

  // Sync width from attrs
  useEffect(() => {
    if (width && width !== currentWidth) setCurrentWidth(width);
  }, [width]);

  return (
    <NodeViewWrapper className="my-3" ref={containerRef}>
      <figure
        className={`relative inline-block ${selected ? 'ring-2 ring-blue-400 ring-offset-2 rounded' : ''}`}
        style={{ width: currentWidth || 'auto', maxWidth: '100%' }}
        data-drag-handle
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || title || ''}
          onLoad={handleLoad}
          className="block w-full rounded-md"
          style={{ cursor: selected ? 'default' : 'pointer' }}
          draggable={false}
        />
        {/* Resize handle (right edge) */}
        <div
          onMouseDown={handleResizeStart}
          className={`absolute top-0 right-0 w-2 h-full cursor-ew-resize group ${isResizing ? 'bg-blue-400/30' : 'hover:bg-blue-400/20'}`}
          title="Drag to resize"
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {/* Caption */}
        {title && (
          <figcaption className="text-xs text-slate-500 text-center mt-1 italic">
            {title}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs(node) {
          const el = node as HTMLElement;
          const dataWidth = el.getAttribute('data-width');
          const styleWidth = el.style?.width;
          let width: number | null = null;
          if (dataWidth) {
            width = parseInt(dataWidth, 10);
          } else if (styleWidth && styleWidth.endsWith('px')) {
            width = parseInt(styleWidth, 10);
          }
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt'),
            title: el.getAttribute('title') || el.closest('figure')?.querySelector('figcaption')?.textContent || null,
            width: width && !isNaN(width) ? width : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, width, ...rest } = HTMLAttributes;
    const imgAttrs = mergeAttributes(rest, {
      class: 'max-w-full rounded-md my-2',
      ...(width ? { 'data-width': width, style: `width: ${width}px` } : {}),
    });
    if (title) {
      return ['figure', { class: 'my-3' }, ['img', imgAttrs], ['figcaption', { class: 'text-xs text-slate-500 text-center mt-1 italic' }, title]];
    }
    return ['img', imgAttrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setResizableImage:
        (options: { src: string; alt?: string; title?: string; width?: number }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },
});
