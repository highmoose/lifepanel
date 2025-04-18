import { Modal } from "@mantine/core";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createTab } from "@redux/slices/tabSlice"; // make sure this exists
import { useState } from "react";

const CreateTabModal = ({ opened, onClose, uid }) => {
  const dispatch = useDispatch();
  const [tabName, setTabName] = useState("");

  const handleCreateTab = () => {
    if (!tabName.trim()) return;

    dispatch(
      createTab({
        uid: uid,
        tab_name: tabName,
      })
    );

    setTabName("");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleCreateTab();
        }
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
          <p className="font-semibold text-lg">Create a new Tab</p>
          <p className="text-sm text-zinc-500">Group your boards into a tab</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tabName" className="text-sm font-bold text-zinc-700">
            Tab name
          </label>
          <input
            type="text"
            id="tabName"
            value={tabName}
            onChange={(e) => setTabName(e.target.value)}
            className="w-full h-10 px-4 rounded border border-zinc-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Work, Home, Projects"
          />
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTab}
            className="px-4 py-2 text-sm text-white bg-zinc-900 rounded hover:bg-zinc-800"
          >
            Create Tab
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTabModal;
