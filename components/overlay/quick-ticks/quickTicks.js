import {
  CircleCheck,
  Check,
  ChevronDown,
  Plus,
  Pencil,
  Circle,
  X,
  Trash2,
  EllipsisVertical,
  TextCursorInput,
  EyeOff,
  Eye,
  Ban,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import { Drawer } from "@mantine/core";
import {
  addQuickTick,
  deleteQuickTick,
  selectAllQuickTicks,
  toggleQuickTickComplete,
  updateQuickTick,
  updateQuickTickAsync,
  updateQuickTickOrderBatch,
  updateQuickTicksOrder,
  deleteQuickTickOptimistically,
  addQuickTickAsync,
  addQuickTickOptimistic,
} from "@redux/slices/quicktickSlice";
import {
  deleteQuickTabAsync,
  deleteQuickTabOptimistic,
  renameQuickTabOptimistic,
  renameQuickTabAsync,
  selectAllQuickTabs,
  addQuickTabAsync,
  updateQuickTabOrderBatch,
  updateQuickTabsOrderAsync,
  addQuickTabOptimistic,
  toggleQuickTabOpen,
  toggleQuickTabOpenOptimistic,
  updateQuickTabColourOptimistic,
  updateQuickTabColour,
} from "@redux/slices/quicktabSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { debounce, set } from "lodash";
import QuickTickModal from "./modals/addQuickTickModal";
import EditQuickTickModal from "./modals/editQuickTickModal";
import RenameQuickTabModal from "./modals/renameQuickTabModal";
import DeleteQuickTabModal from "./modals/deleteQuickTabModal";
import AddQuickTabModal from "./modals/addQuickTabModal";
import { nanoid } from "@reduxjs/toolkit";

const QuickTabs = () => {
  const dispatch = useDispatch();
  const addInputRef = useRef(null);
  const editInputRef = useRef(null);
  const quickTabMenuRef = useRef(null);
  const debouncedSaveTabsRef = useRef(null);

  const quickTicks = useSelector(selectAllQuickTicks);
  const quickTabs = useSelector(selectAllQuickTabs);
  const user = useSelector((state) => state.user.data);

  const [quickTicksOpen, setQuickTicksOpen] = useState(false);
  const [quickTabsOpen, setQuickTabsOpen] = useState([]);

  const [editQuickTickModalOpen, setEditQuickTickModalOpen] = useState(false);
  const [addQuickTickModalOpen, setAddQuickTickModalOpen] = useState(false);

  const [activeModal, setActiveModal] = useState(null);

  const [selectedQuickTab, setSelectedQuickTab] = useState(null);
  const [selectedQuickTick, setSelectedQuickTick] = useState(null);

  const [visibleQuickTabMenu, setVisibleQuickTabMenu] = useState({});

  // Add Quick Tick State
  const [addQuickTabId, setAddQuickTabId] = useState(null);
  const [addQuickTickId, setAddQuickTickId] = useState(null);
  const [addQuickTickName, setAddQuickTickName] = useState("");
  const [addQuickTickPriority, setAddQuickTickPriority] = useState(0);

  // Edit Quick Tick State
  const [editQuickTabId, setEditQuickTabId] = useState(null);
  const [editQuickTickId, setEditQuickTickId] = useState(null);
  const [editQuickTickName, setEditQuickTickName] = useState("");
  const [editQuickTickPriority, setEditQuickTickPriority] = useState(0);

  // Add Quick Tab State
  const [newQuickTabName, setNewQuickTabName] = useState("");

  // Edit Quick Tab State
  const [renameQuickTabId, setRenameQuickTabId] = useState(null);
  const [renameQuickTabName, setRenameQuickTabName] = useState("");

  const [tabOrder, setTabOrder] = useState([]);

  useEffect(() => {
    const sorted = [...quickTabs].sort(
      (a, b) => a.quicktab_order - b.quicktab_order
    );
    setTabOrder(sorted.map((tab) => tab.id));
  }, [quickTabs]);

  const toggleQuickTab = (id) => {
    setQuickTabsOpen((prev) =>
      prev.includes(id) ? prev.filter((openId) => openId !== id) : [...prev, id]
    );
  };

  const handleAddQuickTick = () => {
    if (!addQuickTickName.trim()) return;

    const ticksInTab = quickTicks
      .filter((t) => t.quicktab_id === addQuickTabId)
      .sort((a, b) => a.quicktick_order - b.quicktick_order);

    const lastOrder = ticksInTab.length
      ? ticksInTab[ticksInTab.length - 1].quicktick_order ??
        ticksInTab.length - 1
      : -1;

    const tempId = nanoid();

    const optimisticQuickTick = {
      id: tempId,
      quicktab_id: addQuickTabId,
      quicktick_desc: addQuickTickName.trim(),
      quicktick_priority: addQuickTickPriority,
      quicktick_complete: 0,
      quicktick_order: lastOrder + 1,
    };

    // ✅ Optimistic UI update
    dispatch(addQuickTickOptimistic(optimisticQuickTick));

    // 🔁 Persist to backend
    dispatch(addQuickTickAsync(optimisticQuickTick))
      .unwrap()
      .then((serverTick) => {
        dispatch(deleteQuickTickOptimistically(tempId));
        dispatch(addQuickTickOptimistic(serverTick)); // replaces with real one
      })
      .catch((err) => {
        console.error("❌ Failed to save tick:", err);
        dispatch(deleteQuickTickOptimistically(tempId)); // rollback
      });

    // 🎯 Reset form + close modal
    setAddQuickTickModalOpen(false);
    setAddQuickTickName("");
    setAddQuickTickPriority(0);
  };

  const handleEditQuickTickSubmit = () => {
    if (!editQuickTickId || !editQuickTickName.trim()) return;

    const originalTick = quickTicks.find((t) => t.id === editQuickTickId);

    const updatedTick = {
      id: editQuickTickId,
      changes: {
        quicktick_desc: editQuickTickName,
        quicktick_priority: editQuickTickPriority,
        quicktick_complete: originalTick?.quicktick_complete ?? 0, // ← preserve status
      },
    };

    dispatch(updateQuickTickAsync(updatedTick));

    setEditQuickTickModalOpen(false);
    setSelectedQuickTick(null);
    setEditQuickTickId(null);
    setEditQuickTickName("");
    setEditQuickTabId(null);
    setEditQuickTickPriority(0);
  };

  const handleRenameQuickTab = () => {
    if (!selectedQuickTab || !renameQuickTabName.trim()) return;

    // 👇 Optimistically update the UI
    dispatch(
      renameQuickTabOptimistic({
        id: selectedQuickTab,
        changes: { quicktab_name: renameQuickTabName },
      })
    );

    // 👇 Proceed with API call
    dispatch(
      renameQuickTabAsync({ id: selectedQuickTab, name: renameQuickTabName })
    )
      .unwrap()
      .then(() => {
        console.log("✅ Rename successful");
      })
      .catch((err) => {
        console.error("❌ Rename failed:", err);
        // Optionally: re-fetch tabs or show error UI
      });
  };

  const handleDeleteQuickTab = () => {
    if (!selectedQuickTab) return;

    dispatch(deleteQuickTabOptimistic(selectedQuickTab));

    dispatch(deleteQuickTabAsync(selectedQuickTab))
      .unwrap()
      .then(() => {
        console.log("✅ Deleted from server");
        setSelectedQuickTab(null);
        setActiveModal(null);
      })
      .catch((err) => {
        console.error("❌ Delete failed, consider restoring:", err);
      });
  };

  const handleAddQuickTab = () => {
    if (!newQuickTabName.trim()) return;

    const tempId = nanoid();

    // 1. Update all existing tabs to move down one spot
    const incrementedTabs = quickTabs.map((tab) => ({
      id: tab.id,
      changes: {
        quicktab_order: tab.quicktab_order + 1,
      },
    }));
    dispatch(updateQuickTabOrderBatch(incrementedTabs));

    // 2. Add the new tab optimistically at the top
    const optimisticTab = {
      id: tempId,
      quicktab_name: newQuickTabName.trim(),
      user_id: user.uid,
      quicktab_order: 0,
    };
    dispatch(addQuickTabOptimistic(optimisticTab));

    // 3. Tell the backend to create it — DO NOT add again to Redux
    dispatch(
      addQuickTabAsync({
        name: newQuickTabName.trim(),
        userId: user.uid,
        quicktab_order: 0,
      })
    )
      .unwrap()
      .then((serverTab) => {
        // DO NOT add serverTab to Redux again — this causes duplication
        // Optionally, replace tempId with real one
        dispatch(deleteQuickTabOptimistic(tempId));
        dispatch(addQuickTabOptimistic(serverTab)); // ✅ Replaces tempId
      })
      .catch((err) => {
        console.error("❌ Failed to save tab:", err);
        dispatch(deleteQuickTabOptimistic(tempId));
      });

    setNewQuickTabName("");
    setActiveModal(null);
  };

  const handleToggleQuickTab = (id) => {
    dispatch(toggleQuickTabOpenOptimistic(id));
    dispatch(toggleQuickTabOpen(id));
  };

  const handleUpdateTabColour = (id, colour) => {
    console.log("handleUpdateTabColour", id, colour);
    dispatch(updateQuickTabColourOptimistic({ id, colour }));
    dispatch(updateQuickTabColour({ id, colour }));
  };

  const handleReorderTabs = (newOrder) => {
    setTabOrder(newOrder);

    const optimistic = newOrder.map((id, index) => ({
      id,
      changes: { quicktab_order: index },
    }));
    dispatch(updateQuickTabOrderBatch(optimistic));

    debouncedSaveTabsRef.current(newOrder);
  };

  useEffect(() => {
    if (editQuickTickModalOpen && editInputRef.current) {
      const input = editInputRef.current;
      input.focus();

      // Move cursor to end
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [editQuickTickModalOpen]);

  useEffect(() => {
    if (addQuickTickModalOpen && addInputRef.current) {
      const input = addInputRef.current;
      input.focus();

      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [addQuickTickModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        quickTabMenuRef.current &&
        !quickTabMenuRef.current.contains(event.target)
      ) {
        setVisibleQuickTabMenu({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    debouncedSaveTabsRef.current = debounce((orderedIds) => {
      const payload = orderedIds.map((id, index) => ({
        id,
        quicktab_order: index,
      }));

      dispatch(
        updateQuickTabOrderBatch(
          payload.map(({ id, quicktab_order }) => ({
            id,
            changes: { quicktab_order },
          }))
        )
      );

      dispatch(updateQuickTabsOrderAsync(payload));
    }, 800);
  }, [dispatch]);

  useEffect(() => {
    if (activeModal !== "edit") {
      setSelectedQuickTick(null);
    }
  }, [activeModal]);

  const sortedTabs = useMemo(() => {
    return [...quickTabs].sort((a, b) => a.quicktab_order - b.quicktab_order);
  }, [quickTabs]);

  const tabColours = [
    "grey", // None Gray
    "lightcoral", // Soft Red
    "lightsalmon", // Soft Orange
    "khaki", // Soft Yellow
    "palegreen", // Soft Green
    "lightblue", // Soft Blue
    "plum", // Soft Purple
    "lightpink", // Soft Pink
  ];

  const getPastelBgClass = (colour) => {
    switch (colour) {
      case "lightcoral":
        return "bg-red-200";
      case "lightsalmon":
        return "bg-orange-200";
      case "khaki":
        return "bg-yellow-200";
      case "palegreen":
        return "bg-green-200";
      case "lightblue":
        return "bg-blue-200";
      case "plum":
        return "bg-purple-200";
      case "lightpink":
        return "bg-pink-200";
      case "grey":
        return "bg-zinc-800";
      default:
        return "bg-white";
    }
  };

  return (
    <>
      <Drawer
        opened={quickTicksOpen}
        onClose={() => {
          setQuickTicksOpen(false);
          setActiveModal(null);
        }}
        withCloseButton={false}
        size={446}
        title={
          <div className="flex items-center justify-between w-full ml-6">
            {/* Title (left) */}
            <div className="flex items-center font-bold text-white">
              Quick Ticks
              <Check size={20} color="#0be345" className="ml-2" />
            </div>

            {/* Add Quick Tab Button (right) */}
            <div className="flex ml-[37px] gap-2">
              <button
                onClick={() => setActiveModal("add-tab")}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-white hover:text-zinc-900 px-3 py-1 h-10 rounded text-sm text-white"
              >
                <Plus size={18} strokeWidth={2} />
                <span>Add Quick Tab</span>
              </button>
              <button
                onClick={() => {
                  setQuickTicksOpen(false);
                  setActiveModal(null);
                }}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-white hover:text-zinc-900 px-3 py-1 h-10 rounded text-sm text-white"
              >
                <X size={18} strokeWidth={2} /> Close
              </button>
            </div>
          </div>
        }
        position="right"
        padding={0}
        withOverlay={false}
        styles={{
          content: {
            backgroundColor: "#18181B",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          },
          header: {
            backgroundColor: "#18181B",
            color: "white",
            fontWeight: 800,
          },
        }}
      >
        <div className="flex flex-col flex-1 h-screen gap-2 overflow-hidden ">
          <Reorder.Group
            axis="y"
            values={sortedTabs.map((tab) => tab.id)}
            onReorder={handleReorderTabs}
            className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-dark px-4"
            layout={false}
          >
            {sortedTabs.map((quickTab) => (
              <Reorder.Item
                drag="y"
                key={quickTab.id}
                value={quickTab.id}
                className="flex items-center gap-2"
              >
                <div
                  className={`relative flex flex-col w-full shadow-xl rounded bg-zinc-800 `}
                >
                  <div
                    className={`flex justify-between w-full rounded  px-6 ${
                      quickTab.quicktab_colour !== null
                        ? getPastelBgClass(quickTab.quicktab_colour)
                        : ""
                    }`}
                  >
                    <div className={`flex items-center gap-4  `}>
                      <button
                        className="flex items-center justify-center h-12 rounded group"
                        onClick={() => {
                          handleToggleQuickTab(quickTab.id);
                        }}
                      >
                        {quickTab.quicktab_open ? (
                          <EyeOff
                            size={22}
                            strokeWidth={1.2}
                            className={`  ${
                              quickTab.quicktab_colour === "grey"
                                ? "text-zinc-300 group-hover:text-white"
                                : "text-zinc-600 group-hover:text-black"
                            }`}
                          />
                        ) : (
                          <Eye
                            size={22}
                            strokeWidth={1.2}
                            className={`   ${
                              quickTab.quicktab_colour === "grey"
                                ? "text-zinc-300 group-hover:text-white"
                                : "text-zinc-600 group-hover:text-black"
                            }`}
                          />
                        )}
                      </button>
                      <div
                        className={`flex items-center  font-bold  py-3 ${
                          quickTab.quicktab_colour === "grey"
                            ? "text-white"
                            : "text-black/70"
                        } `}
                      >
                        <p>{quickTab.quicktab_name}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="flex gap-4 items-center text-zinc-500 text-sm ">
                        <div className="flex gap-0.5">
                          <p>
                            {
                              quickTicks.filter(
                                (tick) =>
                                  tick.quicktab_id === quickTab.id &&
                                  tick.quicktick_complete === 1
                              ).length
                            }
                          </p>
                          /
                          <p className="    flex items-center justify-center">
                            {
                              quickTicks.filter(
                                (tick) => tick.quicktab_id === quickTab.id
                              ).length
                            }{" "}
                          </p>
                        </div>
                      </div>
                      <div>
                        <EllipsisVertical
                          size={22}
                          strokeWidth={1.2}
                          className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisibleQuickTabMenu({
                              ...visibleQuickTabMenu,
                              [quickTab.id]: !visibleQuickTabMenu[quickTab.id],
                            });
                          }}
                        />
                      </div>
                      {visibleQuickTabMenu[quickTab.id] && (
                        <div
                          ref={quickTabMenuRef}
                          className="absolute w-[166px] text-sm h-fit bg-zinc-100 shadow-xl shadow-black/20 rounded top-0 -right-0 overflow-hidden z-[100]"
                        >
                          <div className="divide-y divide-zinc-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuickTab(quickTab.id);
                                setRenameQuickTabName(quickTab.quicktab_name);
                                setActiveModal("rename");
                                setVisibleQuickTabMenu(false);
                              }}
                              className="flex w-full hover:bg-white  items-center justify-between p-2"
                            >
                              <p>Rename Quick Tab</p>
                              <TextCursorInput size={16} strokeWidth={2} />
                            </button>
                            {/* <button className="flex w-full hover:bg-zinc-700 hover:text-white items-center justify-between p-2">
                              <p>Untick All</p>
                              <Check size={16} strokeWidth={2} />
                            </button> */}
                            {/* // I dont think we need this */}
                            <div className="w-full p-2">
                              <div className="flex flex-wrap">
                                {tabColours.map((colour, index) => (
                                  <div
                                    key={index}
                                    className="p-[1.5px] w-1/4 group"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateTabColour(
                                          quickTab.id,
                                          colour
                                        );
                                      }}
                                      className={`relative flex w-full h-[24px]  items-center justify-between p-2 rounded shadow-xs border border-transparent group-hover:border-zinc-700 ${getPastelBgClass(
                                        colour
                                      )}`}
                                    >
                                      {" "}
                                      {colour === "grey" && (
                                        <div className="absolute inset-0 flex justify-center items-center z-10">
                                          <Ban
                                            size={16}
                                            strokeWidth={2}
                                            className="text-white/50"
                                          />
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuickTab(quickTab.id);
                                setActiveModal("delete");
                                setVisibleQuickTabMenu(false);
                              }}
                              className="flex w-full hover:bg-white  items-center justify-between p-2"
                            >
                              <p>Delete Quick Tab</p>
                              <X
                                size={20}
                                strokeWidth={2}
                                className="text-red-500"
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={` ${quickTab.quicktab_open ? "p-4" : ""}`}>
                    {quickTab.quicktab_open === 1 && (
                      <QuickTicks
                        quickTab={quickTab}
                        setSelectedQuickTick={setSelectedQuickTick}
                        setAddQuickTickModalOpen={setAddQuickTickModalOpen}
                        setEditQuickTickModalOpen={setEditQuickTickModalOpen}
                        selectedQuickTick={selectedQuickTick}
                        setEditQuickTickId={setEditQuickTickId}
                        setEditQuickTickName={setEditQuickTickName}
                        setEditQuickTickPriority={setEditQuickTickPriority}
                        setEditQuickTabId={setEditQuickTabId}
                        setAddQuickTabId={setAddQuickTabId}
                        setActiveModal={setActiveModal}
                      />
                    )}
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Add Quick Tick Pop Up */}
          <QuickTickModal
            isOpen={activeModal === "add"}
            onClose={() => {
              setActiveModal(null);
              setAddQuickTabId(null);
            }}
            title="Add a new Quick Tick"
            subtitle="Fill in the form below to add a new QuickTick"
            inputValue={addQuickTickName}
            onInputChange={setAddQuickTickName}
            onSubmit={handleAddQuickTick}
            priority={addQuickTickPriority === 1}
            onTogglePriority={() =>
              setAddQuickTickPriority(addQuickTickPriority === 1 ? 0 : 1)
            }
            inputRef={addInputRef}
          />

          {/* Update Quick Tick Pop Up */}
          <EditQuickTickModal
            isOpen={activeModal === "edit"}
            onClose={() => {
              setActiveModal(null);
              setSelectedQuickTick(null);
            }}
            inputValue={editQuickTickName}
            onInputChange={setEditQuickTickName}
            onSubmit={handleEditQuickTickSubmit}
            priority={editQuickTickPriority === 1}
            onTogglePriority={() =>
              setEditQuickTickPriority(editQuickTickPriority === 1 ? 0 : 1)
            }
            inputRef={editInputRef}
          />
          {/* Rename Quick Tab Pop Up */}
          <RenameQuickTabModal
            isOpen={activeModal === "rename"}
            title="Rename Quick Tab"
            subtitle="Type a new name for this quick tab and click 'Save'"
            inputValue={renameQuickTabName}
            onInputChange={setRenameQuickTabName}
            onClose={() => setActiveModal(null)}
            onSubmit={handleRenameQuickTab}
          />
          {/* Add Quick Tab Pop Up */}
          <AddQuickTabModal
            isOpen={activeModal === "add-tab"}
            onClose={() => setActiveModal(null)}
            inputValue={newQuickTabName}
            onInputChange={setNewQuickTabName}
            onSubmit={handleAddQuickTab}
          />

          {/* Delete Quick Tab Pop Up */}
          <DeleteQuickTabModal
            isOpen={activeModal === "delete"}
            onClose={() => setActiveModal(null)}
            onConfirm={handleDeleteQuickTab}
          />
        </div>
      </Drawer>

      <button
        onClick={() => setQuickTicksOpen(!quickTicksOpen)}
        className="absolute bottom-0 right-0 mr-6 mb-6"
      >
        <div
          className={`flex h-10 gap-2 px-6  rounded bg-zinc-900 text-white shadow-lg shadow-black/5 ${
            quickTicksOpen ? "hidden" : ""
          }  items-center justify-center`}
        >
          <p className="text-sm font-bold">Quick Ticks</p>
          <Check size={16} color="#0be345" />
        </div>
      </button>
    </>
  );
};

const QuickTicks = ({
  quickTab,
  setSelectedQuickTick,
  selectedQuickTick,
  setEditQuickTickId,
  setEditQuickTickName,
  setEditQuickTickPriority,
  setEditQuickTabId,
  setAddQuickTabId,
  setActiveModal,
}) => {
  const dispatch = useDispatch();
  const debouncedSaveRef = useRef();

  const allQuickTicks = useSelector(selectAllQuickTicks);

  const [localOrder, setLocalOrder] = useState([]);
  const debouncedSaveOrderRef = useRef(null);

  const [selectedOption, setSelectedOption] = useState("check");

  const quickTicksInTab = useMemo(() => {
    return allQuickTicks
      .filter((tick) => tick.quicktab_id === quickTab.id)
      .sort((a, b) => a.quicktick_order - b.quicktick_order);
  }, [allQuickTicks, quickTab.id]);

  useEffect(() => {
    setLocalOrder(quickTicksInTab.map((tick) => tick.id));
  }, [quickTicksInTab]);

  useEffect(() => {
    debouncedSaveOrderRef.current = debounce((reordered) => {
      const payload = reordered.map((id, index) => ({
        id,
        quicktick_order: index,
      }));
      dispatch(updateQuickTicksOrder(payload));
    }, 800);
  }, [dispatch]);

  const handleReorder = (newIds) => {
    const reordered = newIds.map((id, index) => ({
      id,
      changes: { quicktick_order: index },
    }));

    dispatch(updateQuickTickOrderBatch(reordered));

    debouncedSaveRef.current(reordered);
  };

  const debouncedToggleDispatch = useCallback(
    debounce((id, quicktick_complete) => {
      dispatch(toggleQuickTickComplete({ id, quicktick_complete }));
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    debouncedSaveRef.current = debounce((reordered) => {
      const toSend = reordered.map(({ id, changes }) => ({
        id,
        quicktick_order: changes.quicktick_order,
      }));

      dispatch(updateQuickTicksOrder(toSend));
    }, 500);
  }, []);

  const handleDeleteQuickTick = (id) => {
    dispatch(deleteQuickTickOptimistically(id)); // 🔥 instant UI update

    dispatch(deleteQuickTick(id)) // 🔁 try to delete on backend
      .unwrap()
      .catch(() => {
        console.error("Failed to delete quickTick");
      });
  };

  return (
    <div>
      <div className="overflow-hidden [] ">
        {localOrder.length > 0 ? (
          <Reorder.Group axis="y" values={localOrder} onReorder={handleReorder}>
            {localOrder.map((tickId) => {
              const quickTick = allQuickTicks.find(
                (tick) => tick.id === tickId
              );
              if (!quickTick) return null;

              return (
                <Reorder.Item key={quickTick.id} value={quickTick.id} drag="y">
                  <div className="flex justify-between items-center w-full px-2 py-[4.5px] hover:bg-zinc-700/30 rounded">
                    <div className="flex flex-col justify-center ">
                      <div
                        className={`text-sm break-all relative ml-2 ${
                          quickTick.quicktick_complete === 1
                            ? "text-zinc-500 line-through"
                            : "text-white"
                        }`}
                      >
                        <div
                          className={` ${
                            selectedQuickTick?.id === quickTick.id &&
                            "text-red-500"
                          }`}
                        >
                          {quickTick.quicktick_desc}
                        </div>
                        {quickTick.quicktick_priority === 1 && (
                          <div className="relative">
                            <div className="absolute w-2 h-2 -left-4 -top-3.5 bg-red-500 rounded-full " />
                            {/* ...rest of tick content */}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex mb-auto items-center gap-1 ">
                      {selectedOption === "check" && (
                        <div
                          onClick={() => {
                            const toggledValue =
                              quickTick.quicktick_complete === 1 ? 0 : 1;

                            dispatch(
                              updateQuickTick({
                                id: quickTick.id,
                                changes: { quicktick_complete: toggledValue },
                              })
                            );

                            debouncedToggleDispatch(quickTick.id, toggledValue);
                          }}
                        >
                          {quickTick.quicktick_complete === 1 ? (
                            <CircleCheck
                              size={22}
                              strokeWidth={1.5}
                              color="#0be345"
                            />
                          ) : (
                            <Circle
                              size={22}
                              strokeWidth={1.5}
                              color="lightgray"
                            />
                          )}
                        </div>
                      )}
                      {selectedOption === "edit" && (
                        <div
                          onClick={() => {
                            setSelectedQuickTick(quickTick);
                            setEditQuickTickId(quickTick.id);
                            setEditQuickTickName(quickTick.quicktick_desc);
                            setEditQuickTickPriority(
                              quickTick.quicktick_priority
                            );
                            setEditQuickTabId(quickTick.quicktab_id);
                            setActiveModal("edit");
                          }}
                        >
                          <Pencil
                            size={22}
                            strokeWidth={2}
                            className="text-zinc-400 hover:text-white"
                          />
                        </div>
                      )}
                      {selectedOption === "delete" && (
                        <button
                          onClick={() => handleDeleteQuickTick(quickTick.id)}
                        >
                          <X
                            size={22}
                            strokeWidth={2}
                            className="text-red-500 rounded-full hover:text-red-300"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        ) : (
          <p className="text-sm text-center text-zinc-500 my-1">
            This list is empty. Add a quick tick to get started
          </p>
        )}
      </div>
      <div className="flex justify-between gap-1 w-full  px-1  mt-4 ">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAddQuickTabId(quickTab.id);
            setActiveModal("add");
          }}
          className="flex gap-1 items-center justify-center rounded text-white hover:bg-white bg-zinc-700 hover:text-black border border-zinc-700 text-xs h-8 px-3"
        >
          <Plus size={16} /> Add Quick Tick
        </button>
        <div className=" flex rounded border border-zinc-700 divide-x-[1px] divide-zinc-700">
          <button
            onClick={() => setSelectedOption("check")}
            className={`flex items-center justify-center rounded-l text-white text-sm h-8 w-8 `}
          >
            <CircleCheck
              size={18}
              strokeWidth={1.6}
              className={`${
                selectedOption === "check"
                  ? "text-white bg-zinc-"
                  : "text-zinc-600"
              }`}
            />
          </button>
          <button
            onClick={() => setSelectedOption("edit")}
            className={`flex items-center justify-center  text-white text-sm h-8 w-8 `}
          >
            <Pencil
              size={16}
              className={`${
                selectedOption === "edit" ? "text-white" : "text-zinc-600"
              }`}
            />
          </button>
          <button
            onClick={() => setSelectedOption("delete")}
            className={`flex items-center justify-center rounded-r text-white text-sm h-8 w-8 `}
          >
            <Trash2
              size={16}
              className={`${
                selectedOption === "delete" ? "text-white" : "text-zinc-600"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export { QuickTabs, QuickTicks };
