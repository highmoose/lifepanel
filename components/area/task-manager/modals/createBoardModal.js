import { Modal } from "@mantine/core";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createBoard } from "@redux/slices/boardSlice";
import { useState } from "react";

const CreateBoardModal = ({ opened, onClose, activeTabId, uid }) => {
  const dispatch = useDispatch();
  const [boardName, setBoardName] = useState("");

  const handleCreateBoard = () => {
    if (!boardName.trim()) return;

    dispatch(
      createBoard({
        uid: uid,
        tab_id: activeTabId,
        board_name: boardName,
      })
    );

    setBoardName("");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleCreateBoard();
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
          <p className="font-semibold text-lg">Create a new Board</p>
          <p className="text-sm text-zinc-500">
            Organize your tasks and checklists
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="boardName"
            className="text-sm font-bold text-zinc-700"
          >
            Board name
          </label>
          <input
            type="text"
            id="boardName"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="w-full h-10 px-4 rounded border border-zinc-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Marketing Roadmap"
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
            onClick={handleCreateBoard}
            className="px-4 py-2 text-sm text-white bg-zinc-900 rounded hover:bg-zinc-800"
          >
            Create Board
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateBoardModal;
