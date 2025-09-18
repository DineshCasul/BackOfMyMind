"use client";

import { useState } from "react";
import FormModal from "./FormModal";
import { MoodType } from "@/context/DreamContext";

interface DreamCardProps {
  id: number;
  title: string;
  description: string;
  mood: MoodType;
  onEdit: (id: number, title: string, description: string, mood: MoodType) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export default function DreamCard({
  id,
  title,
  description,
  mood,
  onEdit,
  onDelete,
  className = "",
}: DreamCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setIsEditModalOpen(true)}
        className={`cursor-pointer flex flex-col justify-between p-4 rounded-xl shadow-sm hover:shadow-md transition bg-white dark:bg-gray-900 ${className}`}
      >
        <div>
          <h4 className="font-semibold text-lg mb-1">{title}</h4>
          <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
            {description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span>{mood === "happy" ? "😊" : mood === "neutral" ? "😐" : "😢"}</span>

          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent opening edit modal
              onDelete(id);
            }}
            className="text-red-500 hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialTitle={title}
        initialDescription={description}
        initialMood={mood}
        onAddDream={(newTitle, newDesc, newMood) => {
          onEdit(id, newTitle, newDesc, newMood);
          setIsEditModalOpen(false);
        }}
      />
    </>
  );
}
