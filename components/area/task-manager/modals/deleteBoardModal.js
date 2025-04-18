import { Modal } from "@mantine/core";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { deleteBoard } from "@redux/slices/boardSlice";

const DeleteBoardModal = ({ opened, onClose, boardId }) => {
  const dispatch = useDispatch();

  const handleDeleteBoard = () => {
    if (!boardId) return;

    dispatch(deleteBoard({ board_id: boardId }));
    onClose(); // Close the modal after deletion
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
          <p className="font-semibold text-lg text-red-600">Delete Board</p>
          <p className="text-sm text-zinc-500">
            Are you sure you want to delete this board? This action cannot be
            undone.
          </p>
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteBoard}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-500"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBoardModal;
