import { Modal } from "@mantine/core";
import { X, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { deleteTab } from "@redux/slices/tabSlice";
import { useState } from "react";

const DeleteTabModal = ({ opened, onClose, tabs = [] }) => {
  const dispatch = useDispatch();
  const [selectedTabId, setSelectedTabId] = useState("");

  const handleDeleteTab = () => {
    if (!selectedTabId) return;

    dispatch(deleteTab({ tabId: selectedTabId }));
    onClose();
    setSelectedTabId(""); // Reset after closing
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        setSelectedTabId("");
      }}
      size="sm"
      withCloseButton={false}
      radius="md"
      padding="md"
      centered
    >
      <div className="relative flex flex-col gap-4 p-4">
        <X
          onClick={onClose}
          size={20}
          className="absolute -right-2 -top-2 cursor-pointer hover:text-zinc-500"
        />

        <div className="text-center">
          <p className="font-semibold text-lg text-red-600">Delete Tab</p>
          <p className="text-sm text-zinc-500">
            Select a tab to delete. This will also delete all boards under it
            and cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="tabSelect"
            className="text-sm font-medium text-zinc-700"
          >
            Select Tab
          </label>
          <select
            id="tabSelect"
            value={selectedTabId}
            onChange={(e) => setSelectedTabId(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="" disabled>
              -- Select a tab --
            </option>
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.tab_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <button
            onClick={handleDeleteTab}
            disabled={!selectedTabId}
            className={`px-4 py-2 text-sm text-white rounded ${
              selectedTabId
                ? "bg-red-600 hover:bg-red-500"
                : "bg-zinc-300 cursor-not-allowed"
            }`}
          >
            <Trash2 size={16} className="inline mr-1" />
            Confirm Delete
          </button>
          <button
            onClick={() => {
              setSelectedTabId("");
              onClose();
            }}
            className="px-4 py-2 text-sm border rounded hover:bg-zinc-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTabModal;
