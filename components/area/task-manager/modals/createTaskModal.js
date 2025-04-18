import { Modal } from "@mantine/core";
import { Calendar, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createTask } from "@redux/slices/taskSlice";
import { useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import moment from "moment";

const PRIORITY_OPTIONS = ["None", "Low", "Medium", "High"];

const CreateTaskModal = ({ opened, onClose, boardId }) => {
  const dispatch = useDispatch();

  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("None");

  const handleCreateTask = () => {
    if (!taskName.trim()) return;

    dispatch(
      createTask({
        board_id: boardId,
        task_name: taskName,
        task_desc: taskDesc || null,
        task_notes: taskNotes || null,
        task_due: taskDue || null,
        task_priority: taskPriority,
      })
    );

    // Reset form
    setTaskName("");
    setTaskDesc("");
    setTaskNotes("");
    setTaskDue("");
    setTaskPriority("None");

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
          <p className="font-semibold text-lg">Create a new Task</p>
          <p className="text-sm text-zinc-500">
            Add details to track your work
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-zinc-700">Task name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full h-10 px-4 rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Write blog post"
          />

          <label className="text-sm font-bold text-zinc-700">Description</label>
          <textarea
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            className="w-full px-4 py-2 rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Optional task description"
          />

          <label className="text-sm font-bold text-zinc-700">Notes</label>
          <textarea
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
            className="w-full px-4 py-2 rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Optional internal notes"
          />

          <label className="text-sm font-bold text-zinc-700">Due date</label>
          <DatePickerInput
            value={taskDue ? new Date(taskDue) : null}
            onChange={(date) =>
              setTaskDue(date ? moment(date).format("YYYY-MM-DD") : "")
            }
            placeholder="Pick a due date"
            leftSection={<Calendar size={18} className="text-zinc-900" />}
            leftSectionPointerEvents="none"
            leftSectionWidth={40} // 👈 icon width
            size="sm"
            clearable
            className="w-full"
            styles={{
              input: {
                backgroundColor: "transparent",
                borderColor: "#d4d4d8",
                height: "40px",
                paddingLeft: "2.5rem", // 👈 add extra padding to clear the icon
                fontSize: "0.875rem",
                color: "black",
              },
            }}
          />

          <label className="text-sm font-bold text-zinc-700">Priority</label>
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            className="w-full h-10 px-4 rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 text-sm text-white bg-zinc-900 rounded hover:bg-zinc-800"
          >
            Create Task
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

export default CreateTaskModal;
