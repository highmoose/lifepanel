import {
    Circle,
    CircleCheck,
    Trash2,
    X,
    Plus,
    Pencil,
    Check,
    ClipboardCheck,
    Flag,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { auth, db } from "../../src/app/firebase/config";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    writeBatch,
} from "firebase/firestore";
import { Reorder } from "framer-motion";
import { Drawer, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ClipLoader from "react-spinners/MoonLoader";
import { onAuthStateChanged } from "firebase/auth";

export default function QuickTicks({}) {
    const [quickTicksOpen, setQuickTicksOpen] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);

    const [quickTicks, setQuickTicks] = useState([]);
    const [newQuickTick, setNewQuickTick] = useState({
        priority: "",
        data: "",
    });
    const [deleteQuickTicksEnabled, setDeleteQuickTicksEnabled] =
        useState(false);

    const [editQuickTick, setEditQuickTick] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [tasksLocked, setTasksLocked] = useState(true);

    const getQuickTickData = async () => {
        await fetchQuickTickData();
    };

    const fetchQuickTickData = async () => {
        const quickTickData = await fetchQuickTicks();
        setQuickTicks(quickTickData);
        setIsLoading(false);
    };

    // const fetchQuickTicks = async () => {
    //     const quickTicksCollection = collection(
    //         db,
    //         "userData",
    //         auth.currentUser.uid,
    //         "overlay",
    //         "quickticks",
    //         "quicktickdata"
    //     );
    //     const quickTicksSnapshot = await getDocs(quickTicksCollection);
    //     return quickTicksSnapshot.docs
    //         .map((doc) => ({
    //             ...doc.data(),
    //             id: doc.id,
    //         }))
    //         .sort((a, b) => a.qtOrder - b.qtOrder); // Sort by qtOrder
    // };

    const waitForAuth = () =>
        new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    unsubscribe();
                    resolve(user);
                }
            });
        });

    const fetchQuickTicks = async () => {
        const user = auth.currentUser || (await waitForAuth()); // Wait until auth.currentUser is ready

        if (!user) {
            return [console.error("User is not logged in.")];
        }

        try {
            const quickTicksCollection = collection(
                db,
                "userData",
                user.uid,
                "overlay",
                "quickticks",
                "quicktickdata"
            );
            const quickTicksSnapshot = await getDocs(quickTicksCollection);
            return quickTicksSnapshot.docs
                .map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }))
                .sort((a, b) => a.qtOrder - b.qtOrder); // Sort by qtOrder
        } catch (error) {
            console.error("Error fetching quick ticks:", error);
            return [];
        }
    };

    const toggleTickCompletion = async (id, currentCompletedStatus) => {
        try {
            const tickDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "overlay",
                "quickticks",
                "quicktickdata",
                id
            );

            // Toggle the completed status
            await updateDoc(tickDocRef, {
                qtComplete: !currentCompletedStatus, // Toggle the current status
            });
        } catch (e) {
            console.error("Error updating document: ", e);
        }
        fetchQuickTickData();
    };

    const deleteQuickTick = async (id) => {
        try {
            const tickDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "overlay",
                "quickticks",
                "quicktickdata",
                id
            );
            await deleteDoc(tickDocRef);
            console.log("Quick Tick successfully deleted!");
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
        fetchQuickTickData();
    };

    const modifyQuickTick = async (id) => {
        try {
            const tickDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "overlay",
                "quickticks",
                "quicktickdata",
                id
            );

            // Find the specific tick in quickTicks array that matches the provided id
            const tickToUpdate = quickTicks.find((tick) => tick.id === id);

            if (tickToUpdate) {
                await updateDoc(tickDocRef, {
                    qtData: tickToUpdate.qtData,
                });
                console.log("Quick tick updated successfully!");
            }
        } catch (e) {
            console.error("Error updating document: ", e);
        }

        setEditQuickTick(false); // Exit edit mode
    };

    const submitNewQuickTick = async (e) => {
        e.preventDefault();
        try {
            const newOrder = quickTicks.length + 1; // Set the new order
            const docRef = await addDoc(
                collection(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "overlay",
                    "quickticks",
                    "quicktickdata"
                ),
                {
                    qtData: newQuickTick.data,
                    qtPriority: newQuickTick.priority,
                    qtComplete: false,
                    qtOrder: newOrder, // Set initial qtOrder
                }
            );
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        fetchQuickTickData();
        setNewQuickTick({ data: "", priority: false });
    };

    const updateQuickTicksOrderInDatabase = async (updatedQuickTicks) => {
        try {
            const batch = writeBatch(db);
            updatedQuickTicks.forEach((tick, index) => {
                const tickDocRef = doc(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "overlay",
                    "quickticks",
                    "quicktickdata",
                    tick.id
                );
                batch.update(tickDocRef, { qtOrder: index + 1 });
            });
            await batch.commit();
            console.log(
                "Quick ticks order updated in the database successfully!"
            );
        } catch (error) {
            console.error(
                "Error updating quick ticks order in the database: ",
                error
            );
        }
    };

    // toggle priority of quick tick, on or off. If no priority, create a field in database in the document called qtPriority
    const toggleQuickTickPriority = async (id, currentPriority) => {
        try {
            const tickDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "overlay",
                "quickticks",
                "quicktickdata",
                id
            );

            // Default to `false` if `currentPriority` is `undefined` or `null`
            const newPriority =
                currentPriority !== undefined && currentPriority !== null
                    ? !currentPriority
                    : true;

            await updateDoc(tickDocRef, {
                qtPriority: newPriority, // Toggle or set to `true` if not present
            });

            getQuickTickData();
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    };

    const handleToggleQuickTicks = (id, currentPriority) => {
        toggleQuickTickPriority(id, currentPriority);
    };

    useEffect(() => {
        getQuickTickData();
    }, []);

    const [color, setColor] = useState("#F87315");
    const override = {
        display: "block",
        margin: "0 auto",
        borderColor: "red",
    };


    return (
        <>
            <Drawer
                opened={quickTicksOpen}
                onClose={() => setQuickTicksOpen(false)}
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center", // Center horizontally
                            width: "100%", // Ensure it spans the width
                        }}
                        className="font-bold flex justify-center"
                    >
                        Quick Ticks{" "}
                        <Check
                            size={20}
                            color="#0be345"
                            style={{ marginLeft: "6px" }}
                        />
                    </div>
                }
                position="right"
                withOverlay={false}
                styles={{
                    content: {
                        backgroundColor: "#18181b",
                    },
                    header: {
                        backgroundColor: "#18181b",
                        color: "white",
                        fontWeight: 800,
                    },
                    // body: {
                    //     padding: 0,
                    // },
                }}
            >
                {/* DIV TO GROW / EXPAND */}
                {isLoading ? (
                    <div className="h-[calc(100vh-78px)] flex items-center justify-center w-full ">
                        <ClipLoader
                            color={color}
                            loading={isLoading}
                            cssOverride={override}
                            size={46}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    </div>
                ) : (
                    <div className="flex h-[calc(100vh-78px)] flex-col justify-end rounded-md shadow-xl shadow-black/5">
                        {/*  */}
                        <div className="flex flex-col justify-end">
                            <Reorder.Group
                                axis="y"
                                values={quickTicks}
                                onReorder={(reorderedQuickTicks) => {
                                    const updatedQuickTicks =
                                        reorderedQuickTicks.map(
                                            (tick, index) => ({
                                                ...tick,
                                                qtOrder: index + 1,
                                            })
                                        );

                                    setQuickTicks(updatedQuickTicks);
                                    updateQuickTicksOrderInDatabase(
                                        updatedQuickTicks
                                    );
                                }}
                            >
                                <div className="scrollbar-custom h-[calc(100vh-240px)] pt-2 flex flex-col gap-3 rounded-lg flex-grow  overflow-y-auto">
                                    {quickTicks.map((tick) => (
                                        <Reorder.Item
                                            drag={tasksLocked && "y"}
                                            key={tick.id}
                                            value={tick}
                                        >
                                            <>
                                                <div
                                                    key={tick.id}
                                                    className="w-full flex gap-2 justify-between items-start cursor-ns-resize bg-[#202023] rounded-lg p-4 hover:bg-zinc-800"
                                                >
                                                    {editQuickTick ===
                                                    tick.id ? (
                                                        <div className="w-full pb-2 relative ">
                                                            {tick.qtPriority && (
                                                                <div className="w-2 h-2  -mt-3 mb-1.5 -ml-3 text-xs flex items-center justify-center bg-red-500 rounded-full"></div>
                                                            )}
                                                            <Textarea
                                                                autosize="true"
                                                                value={
                                                                    tick.qtData
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const updatedTicks =
                                                                        quickTicks.map(
                                                                            (
                                                                                t
                                                                            ) =>
                                                                                t.id ===
                                                                                tick.id
                                                                                    ? {
                                                                                          ...t,
                                                                                          qtData: e
                                                                                              .target
                                                                                              .value,
                                                                                      } // Update qtData for the specific tick
                                                                                    : t
                                                                        );
                                                                    setQuickTicks(
                                                                        updatedTicks
                                                                    );
                                                                }}
                                                                styles={{
                                                                    input: {
                                                                        backgroundColor:
                                                                            "#18181B",
                                                                        borderColor:
                                                                            "#ffffff",
                                                                        color: "#ffffff",
                                                                        height: "100%", // Makes height full
                                                                        lineHeight: 1.5,
                                                                    },
                                                                    placeholder:
                                                                        {
                                                                            color: "#4a4e66", // Placeholder text color (gray)
                                                                        },
                                                                }}
                                                                minRows={3}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p
                                                            className={` text-sm ${
                                                                tick.qtComplete
                                                                    ? "line-through text-zinc-600"
                                                                    : "text-white"
                                                            }`}
                                                        >
                                                            {tick.qtPriority && (
                                                                <>
                                                                    {tick.qtComplete ? (
                                                                        <div className="w-2 h-2  -mt-3 mb-1.5 -ml-3 text-xs flex items-center justify-center bg-zinc-600 rounded-full"></div>
                                                                    ) : (
                                                                        <div className="w-2 h-2  -mt-3 mb-1.5 -ml-3 text-xs flex items-center justify-center bg-red-500 rounded-full"></div>
                                                                    )}
                                                                </>
                                                            )}

                                                            {tick.qtData}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-col gap-1 items-end">
                                                        <div className="flex gap-1 items-center cursor-pointer">
                                                            <div>
                                                                {tick.qtComplete ? (
                                                                    <div
                                                                        onClick={() =>
                                                                            toggleTickCompletion(
                                                                                tick.id,
                                                                                tick.qtComplete
                                                                            )
                                                                        }
                                                                    >
                                                                        <CircleCheck
                                                                            color="#0be345"
                                                                            size={
                                                                                20
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() =>
                                                                            toggleTickCompletion(
                                                                                tick.id,
                                                                                tick.qtComplete
                                                                            )
                                                                        }
                                                                    >
                                                                        <Circle
                                                                            color="#a3a3a3"
                                                                            size={
                                                                                20
                                                                            }
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {!deleteQuickTicksEnabled ? (
                                                                <div
                                                                    onClick={() => {
                                                                        setEditQuickTick(
                                                                            tick.id
                                                                        );
                                                                        setTasksLocked(
                                                                            false
                                                                        );
                                                                    }}
                                                                    className={`${
                                                                        editQuickTick ===
                                                                        tick.id
                                                                            ? "text-white"
                                                                            : "text-zinc-400"
                                                                    } hover:text-white -ml-0.5`}
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            20
                                                                        }
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        deleteQuickTick(
                                                                            tick.id
                                                                        )
                                                                    }
                                                                    className="text-red-100 text-xs rounded-full p-0.5 bg-red-500"
                                                                >
                                                                    <X
                                                                        size={
                                                                            14
                                                                        }
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                        className="cursor-pointer"
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {editQuickTick ===
                                                            tick.id && (
                                                            <>
                                                                {tick.qtPriority ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleToggleQuickTicks(
                                                                                tick.id,
                                                                                tick.qtPriority
                                                                            )
                                                                        }
                                                                        className="w-12 h-4 my-1 text-xs flex items-center justify-center border-transaparent bg-red-500 text-white rounded-full cursor-pointer "
                                                                    >
                                                                        <Flag
                                                                            className=""
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleToggleQuickTicks(
                                                                                tick.id,
                                                                                tick.qtPriority
                                                                            )
                                                                        }
                                                                        className="w-12 h-4 my-1 text-xs flex items-center justify-center border border-zinc-400 text-zinc-400 rounded-full cursor-pointer "
                                                                    >
                                                                        <Flag
                                                                            className=""
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        modifyQuickTick(
                                                                            tick.id
                                                                        );
                                                                        setTasksLocked(
                                                                            true
                                                                        );
                                                                    }}
                                                                    className="flex justify-center w-full text-xs px-2 h-6 gap-x-0.5 items-center bg-white hover:bg-zinc-200 rounded-full text-white "
                                                                >
                                                                    <Check
                                                                        size={
                                                                            16
                                                                        }
                                                                        color="#0be345"
                                                                    />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        </Reorder.Item>
                                    ))}
                                </div>
                            </Reorder.Group>
                            <form
                                onSubmit={submitNewQuickTick}
                                className="flex justify-end items-center my-2 gap-10"
                            >
                                <div className=" w-full">
                                    <textarea
                                        className="py-2 mt-2 pl-2 text-sm w-full mb-0.5 rounded-md appearance-none border border-zinc-500 bg-transparent mr-2 placeholder:text-zinc-600 text-white leading-tight focus:outline-none focus:shadow-outline"
                                        id="newCheckName"
                                        name="newCheckName"
                                        placeholder="e.g. Send an email, Schedule a meeting..."
                                        value={newQuickTick.data}
                                        onChange={(e) =>
                                            setNewQuickTick((prev) => ({
                                                ...prev, // Preserve other state properties
                                                data: e.target.value, // Update only the 'data' field
                                            }))
                                        }
                                        required
                                        style={{ resize: "none" }}
                                        rows="4" // You can adjust the number of rows as needed
                                    />

                                    <div className="flex justify-between w-full h-9">
                                        <div className="flex items-center gap-2  ">
                                            <button
                                                type="submit"
                                                className="flex items-center justify-center text-sm px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white w-[200px]"
                                            >
                                                <p>Submit New Tick</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewQuickTick((prev) => ({
                                                        ...prev, // Preserve the rest of the fields
                                                        priority:
                                                            !prev.priority, // Toggle priority between true and false
                                                    }));
                                                }}
                                                className={` border-2 ${
                                                    newQuickTick.priority ===
                                                    true
                                                        ? "border-transparent bg-red-600 text-white hover:bg-red-500 "
                                                        : "border-transparent bg-zinc-800 text-white hover:bg-zinc-700 "
                                                }  p-2 rounded-full`}
                                            >
                                                <Flag
                                                    size={15}
                                                    strokeWidth={2}
                                                />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2  ">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteQuickTicksEnabled(
                                                        !deleteQuickTicksEnabled
                                                    )
                                                }
                                                className={`bg-zinc-800 border-2 ${
                                                    deleteQuickTicksEnabled
                                                        ? "border-red-500"
                                                        : "border-transparent"
                                                }  p-2 rounded-full text-white hover:bg-zinc-700 hover:text-white`}
                                            >
                                                <Trash2
                                                    size={16}
                                                    strokeWidth={2}
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQuickTicksOpen(
                                                        !quickTicksOpen
                                                    )
                                                }
                                                className={`bg-zinc-800 border-2 border-transparent
                                                      p-2 rounded-full text-white hover:bg-zinc-700 hover:text-white`}
                                            >
                                                <X size={16} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Drawer>

            <button
                onClick={() => setQuickTicksOpen(!quickTicksOpen)}
                className="absolute bottom-0 right-0 mr-6 mb-6"
            >
                <div
                    className={`flex h-10 gap-2 px-6 border rounded-full bg-zinc-900 text-white shadow-lg shadow-black/5 ${
                        quickTicksOpen ? "hidden" : ""
                    }  items-center justify-center`}
                >
                    <p className="text-sm font-bold">Quick Ticks</p>
                    <Check size={16} color="#0be345" />
                </div>
            </button>
        </>
    );
}
