import { Modal } from "@mantine/core";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { moveBoardToTab } from "@redux/slices/boardSlice"; // You need this thunk

const MoveBoardModal = ({ opened, onClose, board, tabs }) => {
  const dispatch = useDispatch();
  const [selectedTabId, setSelectedTabId] = useState("");

  useEffect(() => {
    if (board?.tab_id) {
      setSelectedTabId(board.tab_id.toString());
    }
  }, [board]);

  const handleMoveBoard = () => {
    if (!board || !selectedTabId || selectedTabId === board.tab_id.toString())
      return;

    console.log(
      "Moving board with ID:",
      board.id,
      "to tab with ID:",
      selectedTabId
    );
    dispatch(
      moveBoardToTab({
        board_id: board.id,
        tab_id: parseInt(selectedTabId),
      })
    );

    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
          <p className="font-semibold text-lg">Move Board</p>
          <p className="text-sm text-zinc-500">
            Choose a tab to move this board into
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="tabSelect"
            className="text-sm font-bold text-zinc-700"
          >
            Select Tab
          </label>
          <select
            id="tabSelect"
            value={selectedTabId}
            onChange={(e) => setSelectedTabId(e.target.value)}
            className="w-full h-10 px-4 rounded border border-zinc-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.tab_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <button
            onClick={handleMoveBoard}
            className="px-4 py-2 text-sm text-white bg-zinc-900 rounded hover:bg-zinc-800"
          >
            Move Board
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-zinc-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MoveBoardModal;
