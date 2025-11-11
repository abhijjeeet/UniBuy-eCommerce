import React, { useState } from "react";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";

import Loader from "../components/Loader";
import { createtagAdmin, deletetagAdmin, getTags, updatetagAdmin } from "../services/apiServices";

export default function Tags() {
  const { data: tags, refetch, isLoading } = useSuspenseQuery({
    queryKey: ["admin-tags"],
    queryFn: getTags,
  });

  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null); // tag being edited
  const [editName, setEditName] = useState("");

  const { mutateAsync: createTag, isPending: isCreating } = useMutation({
    mutationFn: createtagAdmin,
    onSuccess: refetch,
  });

  const { mutateAsync: deleteTag, isPending: isDeleting } = useMutation({
    mutationFn: deletetagAdmin,
    onSuccess: refetch,
  });

  const { mutateAsync: updateTag, isPending: isUpdating } = useMutation({
    mutationFn: updatetagAdmin,
    onSuccess: () => {
      setEditing(null);
      refetch();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createTag({ name });
    setName("");
  };

  const openEditModal = (tag) => {
    setEditing(tag);
    setEditName(tag.name);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    await updateTag({ id: editing.id, name: editName });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          🏷️ Tags
        </h2>

        {/* Add Tag Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <input
            type="text"
            placeholder="New tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
            required
          />
          <button
            type="submit"
            disabled={isCreating}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-60"
          >
            {isCreating ? "Adding..." : "Add"}
          </button>
        </form>

        {/* Tag List */}
        <div className="grid gap-3">
          {tags?.length ? (
            tags.map((t) => (
              <div
                key={t.id}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center hover:bg-gray-100 transition"
              >
                <p className="font-medium text-gray-800">{t.name}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(t)}
                    className="text-green-600 text-sm font-medium hover:text-green-800 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTag(t.id)}
                    disabled={isDeleting}
                    className="text-red-500 text-sm font-medium hover:text-red-700 transition"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-8">
              No tags yet. Add one above!
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Edit Tag
            </h3>

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm mb-4"
              placeholder="Tag name"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-70"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
