import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { Reorder } from "framer-motion";
import {
  Check,
  Circle,
  CircleCheck,
  CircleCheckBig,
  EllipsisVertical,
  Eye,
  EyeOff,
  Forward,
  LockIcon,
  LockOpen,
  Pencil,
  Plus,
  SquarePen,
  TextCursorInput,
  Trash2,
  X,
} from "lucide-react";
import { Progress } from "@mantine/core";
import moment from "moment";
// Modals
import DeleteBoardModal from "./modals/deleteBoardModal";
import CreateBoardModal from "./modals/createBoardModal";
import CreateTabModal from "./modals/createTabModal";
import DeleteTabModal from "./modals/deleteTabModal";
// Redux
import {
  deleteTask,
  selectTasksByBoardId,
  reorderTasks,
  saveReorderedTasks,
} from "@redux/slices/taskSlice";
import {
  selectChecksByTaskId,
  toggleCheck,
  reorderChecks,
  updateCheckOptimistically,
  saveReorderedChecks,
  selectChecksGroupedByTask,
} from "@redux/slices/checkSlice";
import {
  saveReorderedBoards,
  selectBoardsByTabId,
  reorderBoards,
} from "@redux/slices/boardSlice";
import MoveBoardToTabModal from "./modals/moveBoardToTabModal";
import RenameBoardModal from "./modals/renameBoardModal";
import { useDispatch, useSelector } from "react-redux";
import { selectAllTabs } from "@redux/slices/tabSlice";
import CreateTaskModal from "./modals/createTaskModal";
import EditTaskModal from "./modals/editTaskModal";
import { debounce, set } from "lodash";

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

export default function TaskManager({ data }) {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.data);
  const tabs = useSelector(selectAllTabs);

  // Tabs State
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0]);
    }
  }, [tabs]);

  // Board State
  const [boardsLocked, setBoardsLocked] = useState(true);

  // untick all checks backs on task.id

  const getBorderClass = (priority) => {
    switch (priority) {
      case "High":
        return "border-red-500";
      case "Medium":
        return "border-orange-400";
      case "Low":
        return "border-yellow-300";
      case "None":
        return "border-zinc-50";
      default:
        return "border-zinc-50";
    }
  };

  const Menu = () => {
    const [createTabModalOpen, setCreateTabModalOpen] = useState(false);
    const [deleteTabModalOpen, setDeleteTabModalOpen] = useState(false);
    const [addBoardModelOpen, setAddBoardModelOpen] = useState(false);

    const allTabs = useSelector(selectAllTabs);

    return (
      <div className="flex w-full justify-between ">
        <div className="flex  gap-2 h-10">
          <button
            onClick={() => setDeleteTabModalOpen(true)}
            className="flex items-center justify-center bg-zinc-900 rounded min-w-10"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={() => setCreateTabModalOpen(true)}
            className="flex w-[180px]  items-center bg-zinc-900 border border-transparent rounded px-3  gap-1"
          >
            <Plus size={18} /> <p className="font-bold">Add Tab</p>
          </button>

          <select
            value={activeTab?.id || ""}
            onChange={(e) => {
              const selectedId = Number(e.target.value); // convert to number if IDs are numbers
              const selected = tabs.find((tab) => tab.id === selectedId);
              setActiveTab(selected);
            }}
            className="w-full font-bold text-sm  px-4 rounded border border-zinc-300  text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="" disabled>
              Select Tab
            </option>
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.tab_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setBoardsLocked(!boardsLocked)}
            className="flex items-center justify-center bg-zinc-900 rounded w-10"
          >
            {boardsLocked ? <LockIcon size={18} /> : <LockOpen size={18} />}
          </button>
          <button
            onClick={() => setAddBoardModelOpen(true)}
            className="flex items-center bg-zinc-900 rounded px-3 py-1.5 gap-1"
          >
            <Plus size={18} /> <p className="font-bold">Add Board</p>
          </button>
        </div>
        {/*Board Modals */}
        {activeTab && (
          <CreateBoardModal
            opened={addBoardModelOpen}
            onClose={() => setAddBoardModelOpen(false)}
            activeTabId={activeTab.id}
            uid={user.uid}
          />
        )}
        <CreateTabModal
          opened={createTabModalOpen}
          onClose={() => setCreateTabModalOpen(false)}
          uid={user.uid}
        />
        <DeleteTabModal
          opened={deleteTabModalOpen}
          onClose={() => setDeleteTabModalOpen(false)}
          tabs={allTabs}
        />
      </div>
    );
  };

  const Boards = () => {
    const boardMenuRef = useRef(null);
    const debouncedSaveRef = useRef();

    const [deleteBoardModalOpen, setDeleteBoardModalOpen] = useState(false);
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [renameBoardModalOpen, setRenameBoardModalOpen] = useState(false);
    const [moveBoardToTabModalOpen, setMoveBoardToTabModalOpen] =
      useState(false);

    const [visibleBoardMenu, setVisibleBoardMenu] = useState({});
    const allBoards = useSelector(selectBoardsByTabId(activeTab?.id));

    const [selectedBoardId, setSelectedBoardId] = useState(null);
    const [selectedBoard, setSelectedBoard] = useState(null);

    const toggleBoardMenu = (boardId) => {
      setVisibleBoardMenu((prev) => {
        const isOpen = !!prev[boardId];
        const newState = {};
        if (!isOpen) {
          newState[boardId] = true;
        }
        return newState;
      });
    };

    useEffect(() => {
      debouncedSaveRef.current = debounce((reorderedBoards) => {
        dispatch(saveReorderedBoards(reorderedBoards));
      }, 1000);
    }, [dispatch]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          boardMenuRef.current &&
          !boardMenuRef.current.contains(event.target)
        ) {
          setVisibleBoardMenu((prev) => ({
            ...prev,
            [Object.keys(prev)[0]]: false,
          }));
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleBoardReorder = (newOrder) => {
      const reordered = newOrder.map((board, index) => ({
        ...board,
        board_order: index,
      }));

      dispatch(reorderBoards(reordered));
      debouncedSaveRef.current(reordered); // 🔥 Batched and debounced
    };

    return (
      <div className="">
        <Reorder.Group
          axis="x"
          values={allBoards}
          onReorder={handleBoardReorder}
        >
          <div className="flex gap-4 ">
            {allBoards.map((board) => (
              <Reorder.Item
                drag={!boardsLocked ? "x" : false}
                key={board.id}
                value={board}
              >
                <div className="relative w-[310px] mt-2">
                  <div className="">
                    <div className="flex justify-between items-center">
                      <div className="py-2 px-1 flex justify-between items-center w-full">
                        <p className="font-bold text-black text-[18px]">
                          {board.board_name}
                        </p>
                        <button onClick={() => toggleBoardMenu(board.id)}>
                          <EllipsisVertical
                            size={19}
                            color="black"
                            className="-mr-1"
                          />
                        </button>
                      </div>
                      {/* Boards Dropdown Menu */}
                      {visibleBoardMenu[board.id] && (
                        <div
                          ref={boardMenuRef}
                          className="absolute w-1/2 h-fit bg-zinc-900 shadow-xl shadow-black/20 rounded top-0 right-0 overflow-hidden z-[100] cur"
                        >
                          <div className="divide-y divide-zinc-800">
                            <button
                              onClick={() => {
                                setSelectedBoard(board);
                                setRenameBoardModalOpen(true);
                                setVisibleBoardMenu({});
                              }}
                              className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2"
                            >
                              <p>Rename Board</p>
                              <TextCursorInput size={16} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBoardId(board.id);
                                setDeleteBoardModalOpen(true);
                                setVisibleBoardMenu({});
                              }}
                              className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2"
                            >
                              <p>Delete Board</p>
                              <Trash2 size={16} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBoard(board);
                                setMoveBoardToTabModalOpen(true);
                                setVisibleBoardMenu({});
                              }}
                              className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2"
                            >
                              <p>Move to Tab</p>
                              <Forward size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBoardId(board.id);
                        setCreateTaskModalOpen(true);
                      }}
                      className="flex w-full justify-center items-center bg-white hover:bg-zinc-900 rounded p-2 group"
                    >
                      <Plus
                        size={20}
                        className="text-black group-hover:text-white"
                      />
                    </button>
                  </div>
                  <Tasks board={board} />
                </div>
                {/* Board Modals */}
              </Reorder.Item>
            ))}
          </div>
          <DeleteBoardModal
            opened={deleteBoardModalOpen}
            onClose={() => {
              setDeleteBoardModalOpen(false);
              setSelectedBoardId(null);
            }}
            boardId={selectedBoardId}
          />
          <CreateTaskModal
            opened={createTaskModalOpen}
            onClose={() => setCreateTaskModalOpen(false)}
            boardId={selectedBoardId}
          />
          <RenameBoardModal
            opened={renameBoardModalOpen}
            onClose={() => setRenameBoardModalOpen(false)}
            board={selectedBoard}
          />
          <MoveBoardToTabModal
            opened={moveBoardToTabModalOpen}
            onClose={() => setMoveBoardToTabModalOpen(false)}
            board={selectedBoard}
            tabs={tabs}
          />
        </Reorder.Group>
      </div>
    );
  };

  const Tasks = ({ board }) => {
    const taskMenuRef = useRef(null);

    const allTasks = useSelector(selectTasksByBoardId(board.id)) || [];
    const checksByTask = useSelector(selectChecksGroupedByTask);

    const [visibleChecks, setVisibleChecks] = useState({});
    const [visibleNotes, setVisibleNotes] = useState({});
    const [visibleTaskMenu, setVisibleTaskMenu] = useState({});

    const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(false);

    const debouncedSave = useCallback(
      debounce((tasks) => {
        dispatch(saveReorderedTasks(tasks));
      }, 1000),
      []
    );

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          taskMenuRef.current &&
          !taskMenuRef.current.contains(event.target)
        ) {
          setVisibleTaskMenu((prev) => ({
            ...prev,
            [Object.keys(prev)[0]]: false,
          }));
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleDeleteTask = (taskId) => {
      dispatch(deleteTask(taskId));
      setVisibleTaskMenu(false);
    };

    const toggleChecks = (taskId) => {
      setVisibleChecks((prev) => ({
        ...prev,
        [taskId]: !prev[taskId],
      }));
    };

    const toggleNotes = (taskId) => {
      setVisibleNotes((prev) => ({
        ...prev,
        [taskId]: !prev[taskId],
      }));
    };

    const toggleTaskMenu = (taskId) => {
      setVisibleTaskMenu((prev) => {
        const isOpen = !!prev[taskId];
        const newState = {};
        if (!isOpen) {
          newState[taskId] = true;
        }
        return newState;
      });
    };

    const handleReorder = (reordered) => {
      const reorderedWithOrder = reordered.map((task, index) => ({
        ...task,
        task_order: index,
      }));

      dispatch(reorderTasks(reorderedWithOrder));
      debouncedSave(reorderedWithOrder);
    };

    return (
      <Reorder.Group
        axis="y"
        values={allTasks}
        onReorder={handleReorder}
        className="flex flex-col gap-2 my-2"
      >
        {allTasks.map((task) => {
          const checks = checksByTask[task.id] || [];

          return (
            <Reorder.Item
              drag={boardsLocked ? "y" : false}
              key={task.id}
              value={task}
            >
              <div
                className={`relative bg-white rounded p-4 border-l-2 ${getBorderClass(
                  task.task_priority
                )} `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className={`text-black text-base font-bold ${
                        checks.length > 0 &&
                        checks.filter((c) => c.check_complete).length ===
                          checks.length &&
                        "line-through "
                      } `}
                    >
                      {task.task_name}
                    </p>
                    <p className="text-gray-600 -mt-0.5">{task.task_desc}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    {checks.length > 0 &&
                      checks.filter((c) => c.check_complete).length ===
                        checks.length && (
                        <CircleCheckBig
                          size={22}
                          strokeWidth={1.8}
                          className="text-green-400"
                        />
                      )}
                    <button onClick={() => toggleTaskMenu(task.id)}>
                      <EllipsisVertical size={20} color="lightgray" />
                    </button>
                  </div>

                  {visibleTaskMenu[task.id] && (
                    <div
                      ref={taskMenuRef}
                      className="absolute w-1/2 h-fit bg-zinc-900 shadow-xl shadow-black/20 rounded top-0 -right-0 overflow-hidden z-[100]"
                    >
                      <div className="divide-y divide-zinc-800">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setEditTaskModalOpen(true);
                            setVisibleTaskMenu(false);
                          }}
                          className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2"
                        >
                          <p>Edit Task</p>
                          <Pencil size={16} strokeWidth={2} />
                        </button>
                        <button className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2">
                          <p>Untick All</p>
                          <Check size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2"
                        >
                          <p>Delete Task</p>
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-2 my-3">
                  <div className="flex gap-2">
                    {task.task_notes && (
                      <button
                        onClick={() => toggleNotes(task.id)}
                        className="text-gray-300 flex items-center gap-1"
                      >
                        Notes
                        {visibleNotes[task.id] ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    )}
                    {checks.length > 0 && (
                      <button
                        onClick={() => toggleChecks(task.id)}
                        className="text-gray-300 flex items-center gap-1"
                      >
                        Checks
                        {visibleChecks[task.id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="text-zinc-300 text-md flex gap-x-1 items-end">
                    {checks.filter((c) => c.check_complete).length || 0} /{" "}
                    {checks.length || 0}
                  </div>
                </div>

                <div className="mb-2">
                  <Progress
                    color="#A6A7BA"
                    radius="xl"
                    size="xs"
                    value={
                      ((checks.filter((c) => c.check_complete).length || 0) /
                        (checks.length || 1)) *
                      100
                    }
                  />
                </div>

                {visibleNotes[task.id] && (
                  <div className="border-y rounded border-gray-100 py-2 ">
                    <p className="flex gap-1 items-center text-zinc-900 text-xs font-semibold">
                      <SquarePen size={12} /> Notes
                    </p>
                    <p className="text-[13px] italic leading-4 text-zinc-400">
                      {task.task_notes}
                    </p>
                  </div>
                )}
                {visibleChecks[task.id] && (
                  <Checks task={task} checks={checks} />
                )}

                {task.task_due && (
                  <p className="text-black text-[12px] px-2 mb-1 py-0.5 rounded bg-zinc-50 w-fit mt-3">
                    {task.task_due && moment(task.task_due).isValid()
                      ? moment(task.task_due).format("DD MMMM YYYY")
                      : "No due date"}
                  </p>
                )}
              </div>
            </Reorder.Item>
          );
        })}

        <EditTaskModal
          opened={editTaskModalOpen}
          onClose={() => setEditTaskModalOpen(false)}
          task={selectedTask}
        />
      </Reorder.Group>
    );
  };

  const Checks = ({ checks }) => {
    const debouncedSaveRef = useRef();
    const toggleCheckDebouncedRef = useRef();

    const [checksOpen, setChecksOpen] = useState(false);
    const [visibleChecks, setVisibleChecks] = useState(false);

    useEffect(() => {
      setVisibleChecks(true);
    });
    [checksOpen];

    useEffect(() => {
      toggleCheckDebouncedRef.current = debounce(
        (toggledCheck, originalCheck) => {
          dispatch(toggleCheck(toggledCheck))
            .unwrap()
            .catch(() => {
              dispatch(updateCheckOptimistically(originalCheck));
              toast.error("Failed to update check");
            });
        },
        500
      );
    }, []);

    const handleToggleCheck = (check) => {
      const toggledCheck = {
        ...check,
        check_complete: check.check_complete ? 0 : 1,
      };

      const originalCheck = { ...check };

      dispatch(updateCheckOptimistically(toggledCheck));

      dispatch(toggleCheck(toggledCheck))
        .unwrap()
        .catch(() => {
          dispatch(updateCheckOptimistically(originalCheck));
          toast.error("Failed to update check");
        });
    };

    useEffect(() => {
      debouncedSaveRef.current = debounce((reordered) => {
        dispatch(saveReorderedChecks(reordered));
      }, 1000);
    }, [dispatch]);

    const handleReorder = (newIds) => {
      const reordered = newIds.map((id, i) => {
        const check = checks.find((c) => c.id === id);
        return { ...check, check_order: i };
      });

      dispatch(reorderChecks(reordered));
      debouncedSaveRef.current(reordered); // 🧠 only one call
    };

    return (
      <div className="pt-2">
        <Reorder.Group
          axis="y"
          values={checks.map((c) => c.id)}
          onReorder={handleReorder}
        >
          {checks.map((check) => (
            <Reorder.Item key={check.id} value={check.id}>
              <div
                className={`rounded transition-opacity duration-1000 ${
                  visibleChecks ? "opacity-100" : "opacity-0"
                } `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className={` text-[13px] ${
                        check.check_complete
                          ? "line-through text-zinc-400/70"
                          : "text-zinc-900"
                      }`}
                    >
                      {check.check_name}
                    </p>
                    <p className="text-gray-300 text-[12px] -mt-1.5">
                      Due:{" "}
                      {check.check_due
                        ? moment(check.check_due).isValid()
                          ? moment(check.check_due).format("DD MMMM YYYY")
                          : "-"
                        : "-"}{" "}
                    </p>
                  </div>
                  <button onClick={() => handleToggleCheck(check)}>
                    {check.check_complete === 1 ? (
                      <CircleCheck
                        size={20}
                        strokeWidth={1.5}
                        color="#0be345"
                      />
                    ) : (
                      <Circle size={20} strokeWidth={1.5} color="lightgray" />
                    )}
                  </button>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden ">
      {/* Menu/Header */}
      <div className="shrink-0 border-b py-2 mr-8">
        <Menu />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Horizontal scroll container */}
        <div className="h-full w-full overflow-x-auto">
          <Boards />
        </div>
      </div>
    </div>
  );
}
