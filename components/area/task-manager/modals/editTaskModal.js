import {
  Calendar,
  Circle,
  CircleCheck,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateTask } from "@redux/slices/taskSlice";
import { useState, useEffect, useRef } from "react";
import { DatePickerInput } from "@mantine/dates";
import { Modal, Select } from "@mantine/core";
import { Reorder } from "framer-motion";
import {
  createCheck,
  deleteCheck,
  deleteCheckOptimistically,
  reorderChecks,
  saveReorderedChecks,
  selectChecksByTaskId,
  toggleCheck,
  updateCheck,
  updateCheckOptimistically,
} from "@redux/slices/checkSlice";
import { debounce, set } from "lodash";
import moment from "moment";

const PRIORITY_OPTIONS = ["None", "Low", "Medium", "High"];

const EditTaskModal = ({ opened, onClose, task }) => {
  const dispatch = useDispatch();
  const debouncedSaveRef = useRef();
  const toggleCheckDebouncedRef = useRef();

  const checks = useSelector(selectChecksByTaskId(task.id));
  // Task State
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("None");

  // Check State
  const [checkName, setCheckName] = useState("");
  const [checkDue, setCheckDue] = useState("");
  const [checkComplete, setCheckComplete] = useState(0);

  // Edit Check State
  const [editCheckModalOpen, setEditCheckModalOpen] = useState(false);
  const [editCheckName, setEditCheckName] = useState("");
  const [editCheckDue, setEditCheckDue] = useState("");
  const [editCheckId, setEditCheckId] = useState(null);

  const [toggleEditCheck, setToggleEditCheck] = useState(false);

  useEffect(() => {
    if (task) {
      setTaskName(task.task_name || "");
      setTaskDesc(task.task_desc || "");
      setTaskNotes(task.task_notes || "");
      setTaskDue(task.task_due?.slice(0, 10) || "");
      setTaskPriority(task.task_priority || "None");
    }
  }, [task]);

  useEffect(() => {
    toggleCheckDebouncedRef.current = debounce(
      (toggledCheck, originalCheck) => {
        dispatch(toggleCheck(toggledCheck))
          .unwrap()
          .catch(() => {
            dispatch(updateCheckOptimistically(originalCheck));
          });
      },
      500
    );
  }, []);

  const handleUpdateTask = () => {
    if (!taskName.trim()) return;

    dispatch(
      updateTask({
        id: task.id,
        changes: {
          task_name: taskName,
          task_desc: taskDesc || null,
          task_notes: taskNotes || null,
          task_due: taskDue || null,
          task_priority: taskPriority,
        },
      })
    );

    onClose();
  };

  useEffect(() => {
    debouncedSaveRef.current = debounce((latestChecks) => {
      dispatch(saveReorderedChecks(latestChecks));
    }, 1000);
  }, [dispatch]);

  const handleModalClose = () => {
    debouncedSaveRef.current?.flush();
    onClose();
  };

  const handleToggleCheck = (check) => {
    const toggledCheck = {
      ...check,
      check_complete: check.check_complete ? 0 : 1,
    };

    const originalCheck = { ...check };

    dispatch(updateCheckOptimistically(toggledCheck));
    toggleCheckDebouncedRef.current(toggledCheck, originalCheck);
  };

  const handleReorder = (newIds) => {
    const reordered = newIds.map((id, i) => {
      const check = checks.find((c) => c.id === id);
      return { ...check, check_order: i };
    });

    dispatch(reorderChecks(reordered));
    debouncedSaveRef.current(reordered);
  };

  const handleDeleteCheck = (checkId) => {
    dispatch(deleteCheckOptimistically(checkId));

    dispatch(deleteCheck(checkId))
      .unwrap()
      .catch(() => {});
  };

  const handleAddCheck = () => {
    if (!checkName.trim()) return;

    const newCheck = {
      check_name: checkName,
      task_id: task.id,
      check_due: checkDue ? moment(checkDue).format("YYYY-MM-DD") : null,
      check_complete: checkComplete,
      check_order: checks.length,
    };

    console.log("Adding check:", newCheck);

    dispatch(createCheck(newCheck)).catch((err) => {
      console.error("Failed to create check:", err);
    });
    setCheckName("");
    setCheckDue("");
    setCheckComplete(0);
  };

  const handleEditCheck = () => {
    if (!editCheckId || !editCheckName.trim()) return;

    const updatedCheck = {
      id: editCheckId,
      check_name: editCheckName,
      check_due: editCheckDue
        ? moment(editCheckDue).format("YYYY-MM-DD")
        : null,
    };

    dispatch(updateCheckOptimistically(updatedCheck));
    dispatch(updateCheck(updatedCheck));

    setEditCheckModalOpen(false);
    setEditCheckId(null);
    setEditCheckName("");
    setEditCheckDue("");
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="1000"
      withCloseButton={false}
      radius="md"
      padding={0}
      centered
    >
      <div className="flex">
        {/* Edit Task */}
        <div className="relative flex flex-col gap-4 p-8 w-full">
          <div className="text-center">
            <p className="font-semibold text-lg">Edit Task</p>
            <p className="text-sm text-zinc-500">Make changes and save</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-bold text-zinc-700">
                Task name
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full h-10 px-4 rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700">
                Description
              </label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full max-h-[200px] px-4 py-2 rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex w-full gap-4">
              <div className="flex-1 flex flex-col ">
                <label className="text-sm font-bold text-zinc-700">
                  Due date
                </label>
                <DatePickerInput
                  value={taskDue ? new Date(taskDue) : null}
                  onChange={(date) =>
                    setTaskDue(date ? moment(date).format("YYYY-MM-DD") : "")
                  }
                  placeholder="Pick a date"
                  leftSection={<Calendar size={18} className="text-zinc-900" />}
                  leftSectionPointerEvents="none"
                  leftSectionWidth={40}
                  size="sm"
                  clearable
                  withAsterisk
                  className="w-full"
                  styles={{
                    input: {
                      backgroundColor: "transparent",
                      borderColor: "#d4d4d8",
                      height: "38px",
                      color: "black",
                    },
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-bold text-zinc-700">
                  Priority
                </label>
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
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-700">Notes</label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 max-h-[200px] rounded border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTask}
              className="px-4 py-2 text-sm text-white bg-zinc-900 rounded hover:bg-zinc-800"
            >
              Save Changes
            </button>
          </div>
        </div>
        {/* Edit Checks */}
        <div className="relative flex flex-col gap-4 p-8 w-full bg-zinc-900 overflow-hidden">
          <X
            onClick={onClose}
            size={20}
            className="absolute text-white right-2 top-2 cursor-pointer hover:text-zinc-500"
          />

          <div className="text-center">
            <p className="font-semibold text-lg text-white">Manage Checks</p>
            <p className="text-sm text-zinc-300">Make changes and save</p>
          </div>

          <div className="flex flex-col h-full gap-4">
            <div>
              <label className="text-sm font-bold text-white">
                Add new check
              </label>
              <div className="flex gap-4 ">
                <input
                  type="text"
                  value={checkName}
                  onChange={(e) => setCheckName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCheck();
                    }
                  }}
                  placeholder="e.g. Call the client, Send an email"
                  className="w-full h-10 px-4 text-white bg-transparent placeholder:text-zinc-500 rounded border border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleAddCheck}
                  className="flex items-center justify-center bg-zinc-800 hover:bg-white hover:text-zinc-900 px-4 rounded gap-1 text-white"
                >
                  <Plus size={18} />
                  <p className="text-sm mt-0.5">Add</p>
                </button>
              </div>
            </div>
            <div className="flex w-full gap-4">
              <div className="flex-1 flex flex-col ">
                <label className="text-sm font-bold text-white">Due date</label>
                <DatePickerInput
                  value={checkDue ? new Date(checkDue) : null}
                  onChange={(val) => setCheckDue(val ?? null)}
                  placeholder="Pick a date"
                  leftSection={<Calendar size={18} className="text-white" />}
                  leftSectionPointerEvents="none"
                  leftSectionWidth={40}
                  size="sm"
                  clearable
                  withAsterisk
                  className="w-full"
                  styles={{
                    input: {
                      backgroundColor: "transparent",
                      color: "white",
                      borderColor: "#3f3f46",
                      height: "38px",
                    },
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-bold text-white">
                  Check status
                </label>
                <Select
                  data={[
                    { value: "complete", label: "Complete" },
                    { value: "incomplete", label: "Incomplete" },
                  ]}
                  value={checkComplete ? "complete" : "incomplete"}
                  onChange={(val) =>
                    setCheckComplete(val === "complete" ? 1 : 0)
                  }
                  placeholder="Select status"
                  clearable
                  styles={{
                    input: {
                      backgroundColor: "transparent",
                      color: "white",
                      borderColor: "#3f3f46",
                      height: "38px",
                    },
                  }}
                  size="sm"
                />
              </div>
            </div>

            {/* Update Check Pop Up  */}
            <div
              className={`absolute flex flex-col w-full bottom-0 bg-zinc-950 rounded px-8 py-6 pb-10 gap-4 left-0 z-10 duration-300 ease-in-out border-t border-zinc-800 ${
                editCheckModalOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-[500px] opacity-100"
              }`}
            >
              <X
                onClick={() => setEditCheckModalOpen(false)}
                size={20}
                className="absolute text-zinc-400 right-2 top-2 cursor-pointer hover:text-white"
              />

              <div className="text-center mb-2">
                <p className="font-semibold text-lg text-white">Update Check</p>
                <p className="text-sm text-zinc-400">
                  Modify the details of this check and click "Update"
                </p>
              </div>

              <textarea
                value={editCheckName}
                onChange={(e) => setEditCheckName(e.target.value)}
                placeholder="Check name"
                rows={3}
                className="w-full px-3 py-2 rounded border bg-zinc-900 border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />

              <div className="flex gap-4">
                <div className="w-full">
                  <DatePickerInput
                    value={editCheckDue}
                    onChange={(val) => setEditCheckDue(val ?? null)}
                    placeholder="Pick a date"
                    leftSection={<Calendar size={18} className="text-white" />}
                    leftSectionPointerEvents="none"
                    leftSectionWidth={40}
                    size="sm"
                    clearable
                    withAsterisk
                    className="w-full"
                    styles={{
                      input: {
                        backgroundColor: "#18181b", // bg-zinc-950
                        color: "white",
                        borderColor: "#27272a", // border-zinc-800
                        height: "38px",
                      },
                    }}
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleEditCheck}
                    className="flex items-center px-4 h-9 bg-zinc-800 hover:bg-white hover:text-zinc-900 rounded text-sm text-white"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col w-full h-full border border-zinc-600 rounded p-3 overflow-hidden">
              <div className="max-h-[284px] overflow-y-auto scrollbar-dark">
                <Reorder.Group
                  axis="y"
                  values={checks.map((c) => c.id)}
                  onReorder={handleReorder}
                >
                  {checks.map((check) => (
                    <Reorder.Item key={check.id} value={check.id}>
                      <div className="rounded hover:bg-zinc-700/30">
                        <div className="flex justify-between items-start gap-2 ">
                          <div>
                            <p
                              className={` text-[13px] ${
                                check.check_complete
                                  ? "line-through text-zinc-400"
                                  : "text-white"
                              }`}
                            >
                              {check.check_name}
                            </p>
                            <p className="text-gray-500 text-[12px] -mt-1.5">
                              Due:{" "}
                              {check.check_due
                                ? moment(check.check_due).isValid()
                                  ? moment(check.check_due).format(
                                      "DD MMMM YYYY"
                                    )
                                  : "-"
                                : "-"}{" "}
                            </p>
                          </div>
                          <div className="flex items-center  gap-1">
                            <button onClick={() => handleToggleCheck(check)}>
                              {check.check_complete === 1 ? (
                                <CircleCheck
                                  size={20}
                                  strokeWidth={1.5}
                                  color="#0be345"
                                />
                              ) : (
                                <Circle
                                  size={20}
                                  strokeWidth={1.5}
                                  color="lightgray"
                                />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditCheckModalOpen(true);
                                setEditCheckName(check.check_name);
                                setEditCheckDue(
                                  check.check_due
                                    ? new Date(check.check_due)
                                    : null
                                ); // ✅ here
                                setEditCheckId(check.id);
                              }}
                              className="flex items-center justify-center rounded-full  w-[19px] h-[19px]"
                            >
                              <Pencil
                                size={22}
                                strokeWidth={2}
                                className="text-zinc-400 hover:text-white"
                              />
                            </button>

                            <button onClick={() => handleDeleteCheck(check.id)}>
                              <X
                                size={28}
                                strokeWidth={2}
                                className="text-red-500 hover:text-red-300 -ml-1"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditTaskModal;
