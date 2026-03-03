"use client";

import { useState } from "react";
import Card from "@/components/Card";
import type { ColumnWithCards, CardInfo } from "@/types";

interface ColumnProps {
  column: ColumnWithCards;
  onCreateCard: (columnId: string, title: string) => void;
  onUpdateCard: (cardId: string, data: Partial<CardInfo>) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    position: number,
  ) => void;
  onUpdateColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export default function Column({
  column,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onUpdateColumn,
  onDeleteColumn,
}: ColumnProps) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    onCreateCard(column.id, newCardTitle.trim());
    setNewCardTitle("");
    setIsAdding(false);
  };

  const handleTitleSave = () => {
    if (columnTitle.trim() && columnTitle.trim() !== column.title) {
      onUpdateColumn(column.id, columnTitle.trim());
    } else {
      setColumnTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const newPosition = column.cards.length; // drop at end
      onMoveCard(data.cardId, data.sourceColumnId, column.id, newPosition);
    } catch {
      console.error("Failed to parse drag data");
    }
  };

  return (
    <div
      className={`flex flex-col w-72 min-w-[18rem] bg-slate-100 rounded-xl p-3 max-h-[calc(100vh-10rem)] ${
        isDragOver ? "ring-2 ring-blue-400 bg-blue-50" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        {isEditingTitle ? (
          <input
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setColumnTitle(column.title);
                setIsEditingTitle(false);
              }
            }}
            className="text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        ) : (
          <h3
            className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900"
            onClick={() => setIsEditingTitle(true)}
          >
            {column.title}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {column.cards.length}
            </span>
          </h3>
        )}
        <button
          onClick={() => onDeleteColumn(column.id)}
          className="text-slate-400 hover:text-red-500 text-xs ml-2"
          title="Delete column"
        >
          ✕
        </button>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {column.cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
          />
        ))}
      </div>

      {/* Add card */}
      {isAdding ? (
        <div className="mt-auto">
          <input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCard();
              if (e.key === "Escape") {
                setNewCardTitle("");
                setIsAdding(false);
              }
            }}
            placeholder="Enter card title..."
            className="w-full text-sm text-slate-900 border border-slate-300 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Add card
            </button>
            <button
              onClick={() => {
                setNewCardTitle("");
                setIsAdding(false);
              }}
              className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-auto text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded px-2 py-1.5 text-left transition-colors"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
