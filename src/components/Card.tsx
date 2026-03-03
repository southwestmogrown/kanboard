"use client";

import { useState } from "react";
import type { CardInfo } from "@/types";

interface CardProps {
  card: CardInfo;
  onUpdate: (cardId: string, data: Partial<CardInfo>) => void;
  onDelete: (cardId: string) => void;
}

export default function Card({ card, onUpdate, onDelete }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");

  const handleSave = () => {
    if (!title.trim()) return;
    onUpdate(card.id, {
      title: title.trim(),
      description: description.trim() || null,
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setTitle(card.title);
      setDescription(card.description || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm font-medium text-slate-900 border border-slate-300 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a description..."
          rows={2}
          className="w-full text-xs text-slate-900 border border-slate-300 rounded px-2 py-1 mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Save
          </button>
          <button
            onClick={() => {
              setTitle(card.title);
              setDescription(card.description || "");
              setIsEditing(false);
            }}
            className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            cardId: card.id,
            sourceColumnId: card.columnId,
            position: card.position,
          }),
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group bg-white rounded-lg shadow-sm border border-slate-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <p
          className="text-sm font-medium text-slate-800 flex-1 cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {card.title}
        </p>
        <button
          onClick={() => onDelete(card.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-2 text-xs"
          title="Delete card"
        >
          ✕
        </button>
      </div>
      {card.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}
      {card.assignee && (
        <div className="flex items-center gap-1 mt-2">
          {card.assignee.image ? (
            <img
              src={card.assignee.image}
              alt=""
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
              {card.assignee.name?.charAt(0) || "?"}
            </div>
          )}
          <span className="text-[10px] text-slate-400">
            {card.assignee.name}
          </span>
        </div>
      )}
    </div>
  );
}
