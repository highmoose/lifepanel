import { Circle, CircleCheck, Trash2, X, Plus } from "lucide-react";
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

export default function QuickTicks({ setQuickTicksOpen }) {
    const [quickTicks, setQuickTicks] = useState([]);
    const [newQuickTick, setNewQuickTick] = useState("");
    const [deleteQuickTicksEnabled, setDeleteQuickTicksEnabled] =
        useState(false);

    const getQuickTickData = async () => {
        await fetchQuickTickData();
    };

    const fetchQuickTickData = async () => {
        const quickTickData = await fetchQuickTicks();
        setQuickTicks(quickTickData);
    };

    const fetchQuickTicks = async () => {
        const quickTicksCollection = collection(
            db,
            "userData",
            auth.currentUser.uid,
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
                    qtData: newQuickTick,
                    qtComplete: false,
                    qtOrder: newOrder, // Set initial qtOrder
                }
            );
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        fetchQuickTickData();
        setNewQuickTick("");
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

    useEffect(() => {
        getQuickTickData();
    }, []);

    return (
        <div className="h-[400px] w-[500px] bg-zinc-900 rounded-md shadow-xl shadow-black/5 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <div className="text-md text-white font-semibold">
                    Quick Ticks
                </div>
                <div
                    onClick={() => setQuickTicksOpen(false)}
                    className="cursor-pointer text-zinc-300 hover:text-white"
                >
                    <X size={18} strokeWidth={3} className="cursor-pointer" />
                </div>
            </div>
            <div className="flex flex-col h-full gap-2 justify-between">
                <Reorder.Group
                    axis="y"
                    values={quickTicks}
                    onReorder={(reorderedQuickTicks) => {
                        const updatedQuickTicks = reorderedQuickTicks.map(
                            (tick, index) => ({
                                ...tick,
                                qtOrder: index + 1,
                            })
                        );

                        setQuickTicks(updatedQuickTicks);
                        updateQuickTicksOrderInDatabase(updatedQuickTicks);
                    }}
                >
                    <div className="w-full flex flex-col gap-2 rounded-lg flex-grow p-2">
                        {quickTicks.map((tick) => (
                            <Reorder.Item key={tick.id} value={tick}>
                                <div
                                    key={tick.id}
                                    className="w-full flex justify-between items-center cursor-ns-resize"
                                >
                                    <p
                                        className={`truncate text-sm ${
                                            tick.qtComplete
                                                ? "line-through text-zinc-600"
                                                : "text-white"
                                        }`}
                                    >
                                        {tick.qtData}
                                    </p>
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
                                                        size={20}
                                                        strokeWidth={1.5}
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
                                                        size={20}
                                                        strokeWidth={1.5}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {deleteQuickTicksEnabled && (
                                            <button
                                                onClick={() =>
                                                    deleteQuickTick(tick.id)
                                                }
                                                className="text-red-100 text-xs rounded-full p-0.5 bg-red-500"
                                            >
                                                <X
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="cursor-pointer"
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </div>
                </Reorder.Group>
                <form
                    onSubmit={submitNewQuickTick}
                    className="flex justify-between items-center mt-2 gap-10"
                >
                    <div className="flex w-full">
                        <input
                            className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-zinc-500 bg-transparent mr-2 placeholder:text-zinc-600  text-white leading-tight focus:outline-none focus:shadow-outline"
                            id="newCheckName"
                            name="newCheckName"
                            type="text"
                            placeholder="e.g. Send an email, Schedule a meeting..."
                            value={newQuickTick}
                            onChange={(e) => setNewQuickTick(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="flex text-xs px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white "
                        >
                            <Plus size={16} strokeWidth={1.5} /> <p>Add</p>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
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
                            <Trash2 size={16} strokeWidth={2} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
