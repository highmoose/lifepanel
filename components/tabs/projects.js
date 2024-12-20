import React, { useRef, CSSProperties } from "react";
import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import ClipLoader from "react-spinners/MoonLoader";

import { db } from "../../src/app/firebase/config";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    writeBatch,
    query,
} from "firebase/firestore";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Progress, Select, Textarea } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import moment from "moment";
import { auth } from "../../src/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

import {
    BetweenHorizonalStart,
    Check,
    Circle,
    CircleCheck,
    CircleCheckBig,
    CircleX,
    EllipsisVertical,
    Eye,
    EyeOff,
    GalleryHorizontalEnd,
    Grip,
    Lock,
    LockOpen,
    MoveHorizontal,
    NotebookPen,
    Pencil,
    Plus,
    PlusIcon,
    SquareCheckBig,
    TextCursorInput,
    Trash2,
    X,
} from "lucide-react";

const override = {
    display: "block",
    margin: "0 auto",
    borderColor: "red",
};

export default function Dashboard(user) {
    const [taskModal, { open: openTaskModal, close: closeTaskModal }] =
        useDisclosure(false);

    const [
        deleteBoardModal,
        { open: openDeleteBoardModal, close: closeDeleteBoardModal },
    ] = useDisclosure(false);

    const [
        renameBoardModal,
        { open: openRenameBoardModal, close: closeRenameBoardModal },
    ] = useDisclosure(false);

    const [confirmDelete, setConfirmDelete] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [boardsLocked, setBoardsLocked] = useState(true);
    const [dragBoard, setDragBoard] = useState();
    const [activeBoardId, setActiveBoardId] = useState({});
    const dropdownRef = useRef(null);

    const [taskDate, setTaskDate] = useState(new Date());

    const [checkListOpen, setCheckListOpen] = useState({});
    const [modalTitle, setModalTitle] = useState("Add New Board");
    const [boardName, setBoardName] = useState("");
    const [renamedBoard, setRenamedBoard] = useState({});
    const [addBoard, setAddBoard] = useState(false);

    const [boards, setBoards] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [checks, setChecks] = useState([]);

    const [editCheck, setEditCheck] = useState([]);
    const [updatedCheck, setUpdatedCheck] = useState({});

    const [notesOpen, setNotesOpen] = useState(false);

    const [projectsLoaded, setProjectsLoaded] = useState(false);

    const [selectedBoard, setSelectedBoard] = useState();
    const [selectedTask, setSelectedTask] = useState();
    const [selectedCheck, setSelectedCheck] = useState();

    const selectedChecks = Array.isArray(checks[selectedTask])
        ? checks[selectedTask]
        : [];

    const sortedChecks = selectedChecks.sort((a, b) => a.cOrder - b.cOrder);
    const [deleteChecksEnabled, setDeleteChecksEnabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [color, setColor] = useState("#F87315");

    const [newBoard, setNewBoard] = useState({
        bName: "",
        bOrder: "",
    });

    const [newTask, setNewTask] = useState({
        tName: "",
        tDesc: "",
        tDue: "",
        tCreated: "",
        tPriority: "",
        tCompleted: "",
        tNotes: "",
    });

    const [newCheck, setNewCheck] = useState({
        cName: "",
        cDue: "",
        cCreated: "",
        cCompleted: "",
    });

    const getProjectData = async () => {
        await fetchBoardsData();
    };

    const fetchBoardsData = async () => {
        const boardsData = await fetchBoards();
        const tasksData = {};
        const checksData = {};

        for (const board of boardsData) {
            const boardId = board.id;
            const boardTasks = await fetchTasks(boardId);

            tasksData[boardId] = boardTasks;

            for (const task of boardTasks) {
                const taskId = task.id;
                const taskChecks = await fetchChecks(boardId, taskId);
                checksData[taskId] = taskChecks;
            }
        }

        setBoards(boardsData);
        setTasks(tasksData);
        setChecks(checksData);
        setProjectsLoaded(true);
    };

    useEffect(() => {
        getProjectData();
    }, []);

    const waitForAuth = () =>
        new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    unsubscribe(); // Stop listening once we have the user
                    resolve(user);
                }
            });
        });

    const fetchBoards = async () => {
        const user = auth.currentUser || (await waitForAuth()); // Wait until auth.currentUser is ready

        if (!user) {
            console.error("User is not logged in.");
            return [];
        }

        try {
            const boardsCollection = collection(
                db,
                "userData",
                user.uid,
                "boards"
            );
            const boardsSnapshot = await getDocs(boardsCollection);
            return boardsSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
        } catch (error) {
            console.error("Error fetching boards:", error);
            return [];
        }
    };

    const fetchTasks = async (boardId) => {
        const tasksCollection = collection(
            db,
            "userData",
            auth.currentUser.uid,
            "boards",
            boardId,
            "tasks"
        );
        const tasksSnapshot = await getDocs(tasksCollection);
        const tasksData = tasksSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));

        setTasks((prevTasks) => ({
            ...prevTasks,
            [boardId]: tasksData,
        }));

        return tasksData;
    };

    const fetchChecks = async (boardId, taskId) => {
        const checksCollection = collection(
            db,
            "userData",
            auth.currentUser.uid,
            "boards",
            boardId,
            "tasks",
            taskId,
            "checks"
        );
        const checksSnapshot = await getDocs(checksCollection);
        const checksData = checksSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));

        setChecks((prevChecks) => ({
            ...prevChecks,
            [taskId]: checksData,
        }));

        return checksData;
    };

    const updateTasksOrderInDatabase = async (boardId, updatedTasks) => {
        try {
            const batch = writeBatch(db);
            updatedTasks.forEach((task, index) => {
                const taskDocRef = doc(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    boardId,
                    "tasks",
                    task.id
                );
                batch.update(taskDocRef, { tOrder: index + 1 });
            });
            await batch.commit();
            console.log("Tasks order updated in the database successfully.");
        } catch (error) {
            console.error(
                "Error updating tasks order in the database: ",
                error
            );
        }
    };

    const updateChecksOrderInDatabase = async (boardId, updatedChecks) => {
        try {
            const batch = writeBatch(db);
            updatedChecks.forEach((check, index) => {
                const checkDocRef = doc(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    boardId,
                    "tasks",
                    selectedTask,
                    "checks",
                    check.id
                );
                batch.update(checkDocRef, { cOrder: index + 1 });
            });
            await batch.commit();
            console.log("Checks order updated in the database successfully!");
        } catch (error) {
            console.error(
                "Error updating checks order in the database: ",
                error
            );
        }
    };

    const modifyCheck = async (check) => {
        try {
            const checkDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard,
                "tasks",
                selectedTask,
                "checks",
                check.id
            );
            await updateDoc(checkDocRef, { cName: updatedCheck });
            console.log("Check updated successfully!");
        } catch (error) {
            console.error("Error updating check: ", error);
        }
        fetchChecks(selectedBoard, selectedTask);
    };

    const toggleCheckListOpen = (taskId) => {
        setCheckListOpen((prevState) => ({
            ...prevState,
            [taskId]: !prevState[taskId],
        }));
    };

    const toggleNotes = (taskId) => {
        // Toggle between taskId and an empty string
        setNotesOpen((prevId) => (prevId === taskId ? "" : taskId));
    };

    const handleEditTask = (task) => {
        setNewTask({
            tName: task.tName,
            tDesc: task.tDesc,
            tDue: task.tDue,
            tPriority: task.tPriority,
            tCompleted: task.tCompleted,
            tNotes: task.tNotes,
        });
        setSelectedTask(task.id);
        openTaskModal();
    };

    const submitNewTask = async (e) => {
        e.preventDefault();
        try {
            const tasksQuerySnapshot = await getDocs(
                collection(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    selectedBoard,
                    "tasks"
                )
            );

            let maxTOrder = 0;
            tasksQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.tOrder !== undefined && data.tOrder > maxTOrder) {
                    maxTOrder = data.tOrder;
                }
            });
            const nextTOrder = maxTOrder + 1;

            const docRef = await addDoc(
                collection(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    selectedBoard,
                    "tasks"
                ),
                {
                    tName: newTask.tName,
                    tDesc: newTask.tDesc || "",
                    tDue: newTask.tDue,
                    tCreated: new Date().toISOString(),
                    tPriority: newTask.tPriority,
                    tCompleted: true,
                    tNotes: newTask.tNotes || "",
                    tOrder: nextTOrder,
                }
            );

            setNewTask({
                tName: "",
                tDesc: "",
                tDue: "",
                tCreated: "",
                tPriority: "",
                tNotes: "",
                tCompleted: "",
            });
            closeTaskModal();
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        fetchTasks(selectedBoard);
    };

    const submitNewBoard = async (e) => {
        e.preventDefault();
        try {
            const boardsQuerySnapshot = await getDocs(
                collection(db, "userData", auth.currentUser.uid, "boards")
            );
            let maxBOrder = 0;
            boardsQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.bOrder !== undefined && data.bOrder > maxBOrder) {
                    maxBOrder = data.bOrder;
                }
            });
            const nextBOrder = maxBOrder + 1;
            const docRef = await addDoc(
                collection(db, "userData", auth.currentUser.uid, "boards"),
                {
                    bName: newBoard.bName,
                    bCreated: new Date().toISOString(),
                    bOrder: nextBOrder,
                }
            );
            setAddBoard(false);
            setNewBoard({ bName: "", bOrder: "" });
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        fetchBoardsData();
    };

    const submitNewCheck = async (e) => {
        e.preventDefault();
        try {
            const checksQuerySnapshot = await getDocs(
                collection(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    selectedBoard,
                    "tasks",
                    selectedTask,
                    "checks"
                )
            );

            let maxCOrder = 0;
            checksQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.cOrder !== undefined && data.cOrder > maxCOrder) {
                    maxCOrder = data.cOrder;
                }
            });
            const nextCOrder = maxCOrder + 1;
            const docRef = await addDoc(
                collection(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    selectedBoard,
                    "tasks",
                    selectedTask,
                    "checks"
                ),
                {
                    cName: newCheck.cName,
                    cDue: newCheck.cDue,
                    cCreated: new Date().toISOString(),
                    cCompleted: newCheck.cCompleted,
                    cOrder: nextCOrder,
                }
            );
            setNewCheck({
                cName: "",
                cDue: "",
                cCompleted: false,
            });
        } catch (e) {
            console.error("Error adding document: ", e);
        }

        fetchChecks(selectedBoard, selectedTask);
    };

    const submitEditTask = async (e) => {
        e.preventDefault();
        try {
            const taskDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard,
                "tasks",
                selectedTask
            );
            await updateDoc(taskDocRef, newTask);
            console.log("Document successfully updated!");
            setNewTask({});
            closeTaskModal();
        } catch (e) {
            console.error("Error updating document: ", e);
        }
        fetchTasks(selectedBoard);
    };

    const updateBoardsOrderinDatabase = async (updatedBoards) => {
        try {
            const batch = writeBatch(db);
            updatedBoards.forEach((board, index) => {
                const boardDocRef = doc(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    board.id
                );
                batch.update(boardDocRef, { bOrder: index + 1 });
            });

            await batch.commit();
            console.log("Boards order updated in the database successfully!");
        } catch (error) {
            console.error(
                "Error updating boards order in the database: ",
                error
            );
        }
    };

    const toggleCheckCompletion = async (
        taskId,
        checkId,
        currentCompletedStatus
    ) => {
        try {
            const checkDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard,
                "tasks",
                taskId,
                "checks",
                checkId
            );

            // Toggle the completed status
            await updateDoc(checkDocRef, {
                cCompleted: !currentCompletedStatus, // Toggle the current status
            });
        } catch (e) {
            console.error("Error updating document: ", e);
        }
        fetchChecks(selectedBoard, selectedTask);
    };

    const deleteCollection = async (collectionRef) => {
        const q = query(collectionRef);
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
    };

    const deleteBoardAndSubcollections = async (boardDocRef) => {
        // Delete all documents in subcollections
        const subcollections = ["tasks", "checks"]; // Replace with actual subcollection names

        for (const subcollectionName of subcollections) {
            const subcollectionRef = collection(boardDocRef, subcollectionName);
            await deleteCollection(subcollectionRef);
        }

        // Finally, delete the board document itself
        await deleteDoc(boardDocRef);
    };

    const deleteBoard = async () => {
        try {
            const boardDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard
            );

            // Delete board and all its subcollections
            await deleteBoardAndSubcollections(boardDocRef);

            console.log("Board and its subcollections successfully deleted!");
            setSelectedBoard("");
        } catch (e) {
            console.error("Error deleting document: ", e);
        } finally {
            fetchBoardsData(); // Fetch updated board data after deletion
        }
    };

    const renameBoard = async () => {
        try {
            const boardDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard
            );
            await updateDoc(boardDocRef, { bName: renamedBoard });
            console.log("Document successfully updated!");
            setSelectedBoard("");
        } catch (e) {
            console.error("Error updating document: ", e);
        }
        fetchBoardsData();
    };

    const deleteCheck = async () => {
        try {
            const checkDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard,
                "tasks",
                selectedTask,
                "checks",
                selectedCheck
            );
            await deleteDoc(checkDocRef);
            console.log("Check successfully deleted!");
            setSelectedCheck({});
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
        fetchChecks(selectedBoard, selectedTask);
    };

    const deleteTask = async () => {
        try {
            const taskDocRef = doc(
                db,
                "userData",
                auth.currentUser.uid,
                "boards",
                selectedBoard,
                "tasks",
                selectedTask
            );
            await deleteDoc(taskDocRef);
            console.log("Task successfully deleted!");
            setSelectedTask({});
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
        fetchTasks(selectedBoard);
    };

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                activeBoardId !== null // Only close if dropdown is open
            ) {
                setActiveBoardId(null); // Close the dropdown
            }
        };

        // Attach event listener for clicks outside
        document.addEventListener("mousedown", handleClickOutside);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeBoardId]);

    const BoardsComponent = ({ board }) => {
        return (
            <div className="">
                <div className="relative w-[310px] shadow-black/5 rounded-xl flex flex-col">
                    <div className=" flex flex-col">
                        <div className="flex flex-col mb-0.5 ">
                            <div>
                                {boardsLocked ? (
                                    <></>
                                ) : (
                                    <div
                                        onMouseOver={() => {
                                            setDragBoard(board.id);
                                        }}
                                        onMouseLeave={() => {
                                            setDragBoard("");
                                        }}
                                        className=" absolute cursor-pointer w-full h-full bg-zinc-100/90 border-zinc-200 border pt-10 "
                                    >
                                        {dragBoard === board.id ? (
                                            <MoveHorizontal
                                                color="#000000"
                                                size={28}
                                                strokeWidth={1.5}
                                                noMargin
                                                className="w-full self-center mt-3"
                                            />
                                        ) : (
                                            <Grip
                                                color="#000000"
                                                size={28}
                                                strokeWidth={1.5}
                                                noMargin
                                                className="w-full self-center mt-3"
                                            />
                                        )}
                                        {dragBoard === board.id && (
                                            <p className="text-zinc-900 text-center text-base font-semibold w-full self-center">
                                                Drag to Reorder
                                            </p>
                                        )}
                                    </div>
                                )}{" "}
                                <div className="flex justify-between relative">
                                    <div className="text-zinc-900 text-lg font-semibold pl-1 ">
                                        {board.bName}
                                    </div>
                                    <button
                                        onClick={() =>
                                            setActiveBoardId(board.id)
                                        }
                                    >
                                        <EllipsisVertical
                                            size={20}
                                            strokeWidth={1.5}
                                            color="#000000"
                                        />
                                    </button>
                                    {activeBoardId === board.id && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute w-1/2 h-fit  bg-zinc-900 shadow-xl shadow-black/20 rounded-md top-8 right-0 overflow-hidden"
                                        >
                                            <div
                                                onClick={() => {
                                                    openRenameBoardModal();
                                                    setBoardName(board.bName);
                                                    setRenamedBoard(
                                                        board.bName
                                                    );
                                                    setSelectedBoard(board.id);
                                                }}
                                                className="flex hover:bg-zinc-700 hover:text-white  items-center justify-between p-2"
                                            >
                                                <p>Rename Board</p>
                                                <TextCursorInput
                                                    size={16}
                                                    strokeWidth={2}
                                                />
                                            </div>
                                            <div className="border border-zinc-800" />
                                            <div
                                                onClick={() => {
                                                    openDeleteBoardModal();
                                                    setBoardName(board.bName);
                                                    setSelectedBoard(board.id);
                                                }}
                                                className="flex  hover:bg-zinc-700 hover:text-white items-center justify-between p-2"
                                            >
                                                <p>Delete Board</p>
                                                <Trash2
                                                    size={16}
                                                    strokeWidth={2}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-x-1">
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setSelectedBoard(board.id);
                                        setSelectedTask();
                                        setModalTitle("Add new task");
                                        openTaskModal();
                                    }}
                                    className="flex w-full gap-x-1 text-zinc-900 items-center py-1.5  text-sm font-semibold tracking-wider"
                                >
                                    <div className="flex items-center justify-center bg-white hover:bg-zinc-900  hover:text-white p-2 rounded-md w-full">
                                        <PlusIcon
                                            size={18}
                                            strokeWidth={2}
                                            noMargin
                                        />
                                    </div>
                                </button>
                            </div>
                        </div>
                        {boardsLocked ? (
                            <Reorder.Group
                                axis="y"
                                values={tasks[board.id]}
                                onReorder={(tasks) => {
                                    const updatedTasks = tasks.map(
                                        (task, index) => ({
                                            ...task,
                                            tOrder: index + 1,
                                        })
                                    );

                                    setTasks((prevTasks) => ({
                                        ...prevTasks,
                                        [board.id]: updatedTasks,
                                    }));

                                    updateTasksOrderInDatabase(
                                        board.id,
                                        updatedTasks
                                    );
                                }}
                            >
                                <div className="flex flex-col gap-2">
                                    {tasks[board.id]
                                        ?.sort((a, b) => a.tOrder - b.tOrder)
                                        .map((task) => (
                                            <Reorder.Item
                                                onMouseOver={() => {
                                                    setSelectedTask(task.id);
                                                    setSelectedBoard(board.id);
                                                }}
                                                key={task.id}
                                                value={task}
                                                className={`${getBorderClass(
                                                    task.tPriority
                                                )} active:shadow-black/5 bg-white rounded-md p-4 border-l-2 `}
                                            >
                                                <TasksComponent
                                                    task={task}
                                                    board={board}
                                                />
                                            </Reorder.Item>
                                        ))}
                                </div>
                            </Reorder.Group>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {tasks[board.id]
                                    ?.sort((a, b) => a.tOrder - b.tOrder)
                                    .map((task) => (
                                        <div
                                            onMouseOver={() => {
                                                setSelectedTask(task.id);
                                                setSelectedBoard(board.id);
                                            }}
                                            key={task.id}
                                            value={task}
                                            className={`${getBorderClass(
                                                task.tPriority
                                            )} active:shadow-black/5 bg-zinc-50 border-[2px]  rounded-xl p-4 `}
                                        >
                                            <TasksComponent
                                                task={task}
                                                board={board}
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const TasksComponent = ({ task, board }) => {
        return (
            <>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-zinc-900 text-base font-semibold">
                            {task?.tName}
                        </p>
                        <p className="text-zinc-600 text-[13px] mb-2 leading-[17px]">
                            {task?.tDesc}
                        </p>
                    </div>
                    <div className="flex">
                        <div className="text-zinc-300 text-md">
                            {checks[task.id]?.filter(
                                (check) => check.cCompleted
                            ).length === checks[task.id]?.length &&
                                checks[task.id]?.length > 0 && (
                                    <CircleCheckBig
                                        size={20}
                                        strokeWidth={1.5}
                                        color="#0be345"
                                    />
                                )}
                        </div>
                        <div></div>
                        <div
                            onClick={() => {
                                setIsEditMode(true);
                                setSelectedBoard(board.id);
                                setSelectedTask(task.id);
                                setModalTitle("Update Task Details");
                                handleEditTask(task);
                            }}
                            className="text-zinc-300 cursor-pointer font-semibold tracking-wider -mr-2"
                        >
                            <EllipsisVertical size={20} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex gap-x-2 cursor-pointer">
                        {checks[task.id] && checks[task.id].length > 0 ? (
                            <div
                                onClick={() => toggleCheckListOpen(task.id)}
                                className="flex gap-x-1"
                            >
                                <div
                                    className={`flex items-center ${
                                        checks[task.id] &&
                                        checks[task.id].length === 0
                                            ? "my-2"
                                            : ""
                                    } `}
                                >
                                    <p className="text-zinc-300 text-sm">
                                        Checks
                                    </p>
                                </div>

                                <div>
                                    {checkListOpen[task.id] ? (
                                        <button className=" text-zinc-300 mt-1.5 h-[26px]  rounded-full text-sm font-semibold">
                                            <EyeOff size={16} strokeWidth={2} />
                                        </button>
                                    ) : (
                                        <button className=" text-zinc-300  mt-1.5 h-[26px] rounded-full text-sm font-semibold">
                                            <Eye size={16} strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : null}
                        {task.tNotes && (
                            <div
                                onClick={() => toggleNotes(task.id)}
                                className="flex gap-x-1  cursor-pointer"
                            >
                                <div
                                    className={`flex items-center ${
                                        checks[task.id] &&
                                        checks[task.id].length === 0
                                            ? "my-2"
                                            : ""
                                    } `}
                                >
                                    <p className="text-zinc-300 text-sm">
                                        Notes
                                    </p>
                                </div>

                                {task.tNotes && (
                                    <div>
                                        {notesOpen ? (
                                            <button className=" text-zinc-300 mt-1.5 h-[26px]  rounded-full text-sm font-semibold">
                                                <EyeOff
                                                    size={16}
                                                    strokeWidth={2}
                                                />
                                            </button>
                                        ) : (
                                            <button className=" text-zinc-300 mt-1.5  h-[26px] rounded-full text-sm font-semibold">
                                                <Eye
                                                    size={16}
                                                    strokeWidth={2}
                                                />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="text-zinc-300 text-md flex gap-x-1 items-end">
                        {/* <p className="text-xs pb-0.5">Progress:</p> */}
                        {checks[task.id]?.filter((check) => check.cCompleted)
                            .length || 0}{" "}
                        / {checks[task.id]?.length || 0}
                    </div>
                </div>
                <div className={` ${!boardsLocked && "opacity-5"} mb-2`}>
                    <Progress
                        color="#A6A7BA"
                        radius="xl"
                        size="xs"
                        value={
                            ((checks[task.id]?.filter(
                                (check) => check.cCompleted
                            ).length || 0) /
                                (checks[task.id]?.length || 1)) *
                            100
                        }
                    />
                </div>
                {notesOpen === task.id && (
                    <div
                        className={`w-full mt-3 mb-2 ${
                            checkListOpen[task.id] ? "mb-1 " : "mb-3"
                        } `}
                    >
                        <div className="flex gap-x-1">
                            <NotebookPen
                                size={26}
                                color="#e4e4e4"
                                strokeWidth={1.5}
                            />
                            <div className="w-full border rounded-md p-0.5 border-zinc-100 px-2">
                                <p className="text-zinc-900 text-[13px] italic leading-4">
                                    {task.tNotes}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {checkListOpen[task.id] ? (
                    <div className=" flex flex-col rounded-md  py-1 ">
                        {checks[task.id]
                            ?.sort((a, b) => a.cOrder - b.cOrder) // Sort checks by cOrder
                            .map((check) => (
                                <div key={check.id} className="">
                                    <div className="flex  w-full gap-1  rounded-full justify-between">
                                        <p>
                                            <p
                                                className={`text-[13px] leading-4  ${
                                                    check.cCompleted
                                                        ? "line-through text-zinc-400"
                                                        : "text-text"
                                                }`}
                                            >
                                                {check.cName}
                                            </p>
                                            <div className="text-[12px] text-zinc-300 -mt-1">
                                                Due:{" "}
                                                {moment(check.cDue).format(
                                                    "DD-MMM-YY"
                                                )}
                                            </div>
                                        </p>

                                        <div>
                                            {check.cCompleted ? (
                                                <div
                                                    onClick={() =>
                                                        toggleCheckCompletion(
                                                            task.id,
                                                            check.id,
                                                            check.cCompleted
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
                                                        toggleCheckCompletion(
                                                            task.id,
                                                            check.id,
                                                            check.cCompleted
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
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : null}

                <div className="flex text-text">
                    {task?.tDue && (
                        <div className="text-zinc-800 bg-zinc-50 text-xs p-1 px-2 rounded-md">
                            {moment(task?.tDue).format("DD MMMM YYYY")}
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="w-full h-screen ">
            {projectsLoaded ? (
                <>
                    <div className="w-full h-full">
                        {/* Boards Nav */}
                        <div className="mb-4 mr-8">
                            <div className="flex justify-between ">
                                <div className="flex w-fit items-center gap-x-2 p-3 border-b-[2px]  border-black">
                                    <GalleryHorizontalEnd
                                        color="#101010 "
                                        size={24}
                                        strokeWidth={1.5}
                                    />
                                    <div className="text-lg text-text font-semibold">
                                        Boards
                                    </div>
                                </div>

                                <div className="flex gap-x-2 items-center ">
                                    {boardsLocked ? (
                                        <button
                                            onClick={() =>
                                                setBoardsLocked(false)
                                            }
                                            className="flex justify-center bg-text items-center cursor-pointer h-[34px] w-[34px] text-zinc-400 p-1 rounded-full text-xs font-semibold tracking-wider"
                                        >
                                            <Lock
                                                color="#ffffff"
                                                size={18}
                                                strokeWidth={1.5}
                                                noMargin
                                            />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setBoardsLocked(true)
                                            }
                                            className="flex justify-center bg-zinc-900 items-center cursor-pointer h-[34px] w-[34px] text-zinc-400 p-1 rounded-full text-xs font-semibold tracking-wider"
                                        >
                                            <LockOpen
                                                color="#ffffff"
                                                size={18}
                                                strokeWidth={1.5}
                                                noMargin
                                            />
                                        </button>
                                    )}
                                    {addBoard ? (
                                        <form
                                            onSubmit={submitNewBoard}
                                            className="flex items-center gap-x-1"
                                        >
                                            <button
                                                type="submit"
                                                className="bg-black whitespace-nowrap h-[34px] px-4 text-white rounded-full font-semibold tracking-wide"
                                            >
                                                Add Board
                                            </button>
                                            <input
                                                className="h-9 appearance-none rounded-full w-full px-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                id="username"
                                                name="username"
                                                type="text"
                                                placeholder="Enter New Board Name"
                                                required
                                                value={newBoard.name}
                                                onChange={(e) =>
                                                    setNewBoard({
                                                        ...newBoard,
                                                        bName: e.target.value,
                                                    })
                                                }
                                            />
                                            <button
                                                onClick={() =>
                                                    setAddBoard(false)
                                                }
                                                className="whitespace-nowrap text-white my-2.5  rounded-full font-semibold tracking-wide"
                                            >
                                                <CircleX
                                                    color="#c9c9c9"
                                                    size={20}
                                                    strokeWidth={1.5}
                                                    noMargin
                                                />
                                            </button>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => setAddBoard(true)}
                                            className="bg-zinc-900 whitespace-nowrap h-[34px] text-white px-4 my-2.5 rounded-full font-semibold tracking-wide"
                                        >
                                            New Board
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="h-[2px] bg-zinc-300 -mt-[2px]"></div>
                        </div>
                        <div className="w-full h-[calc(100vh-8.1rem)] overflow-y-scroll">
                            {boardsLocked ? (
                                <div className="flex gap-4 ">
                                    {boards
                                        .sort((a, b) => a.bOrder - b.bOrder)
                                        .map((board, index) => (
                                            <BoardsComponent
                                                key={board.id}
                                                board={board}
                                            />
                                        ))}
                                </div>
                            ) : (
                                <Reorder.Group
                                    axis="x"
                                    values={boards}
                                    onReorder={(boards) => {
                                        const updatedBoards = boards.map(
                                            (board, index) => ({
                                                ...board,
                                                bOrder: index + 1,
                                            })
                                        );
                                        setBoards(updatedBoards);
                                        updateBoardsOrderinDatabase(
                                            updatedBoards
                                        );
                                    }}
                                >
                                    <div className="flex gap-4 overflow-x-auto">
                                        {boards
                                            .sort((a, b) => a.bOrder - b.bOrder)
                                            .map((board, index) => (
                                                <Reorder.Item
                                                    key={board.id}
                                                    value={board}
                                                >
                                                    <BoardsComponent
                                                        board={board}
                                                    />
                                                </Reorder.Item>
                                            ))}
                                    </div>
                                </Reorder.Group>
                            )}
                        </div>
                        <Modal
                            size={1000}
                            radius={"md"}
                            opened={taskModal}
                            onClose={() => {
                                closeTaskModal();
                                setNewTask({});
                            }}
                            centered
                            withCloseButton={false}
                            padding={0}
                            closeOnClickOutside={true}
                        >
                            <div className="flex">
                                {/* Modal Task Form  */}
                                <form
                                    class="newTask"
                                    onSubmit={
                                        isEditMode
                                            ? submitEditTask
                                            : submitNewTask
                                    }
                                    className="border-zinc-100  w-1/2 p-8 "
                                >
                                    <div className="flex flex-col justify-between h-full">
                                        <div>
                                            <div className="mb-4">
                                                <p className="block text-zinc-900 text-lg font-bold mb-4">
                                                    {modalTitle}
                                                </p>
                                                <label
                                                    className="block text-gray-700 text-sm font-bold mb-1"
                                                    for="newTaskName"
                                                >
                                                    Task Name
                                                </label>
                                                <input
                                                    className="h-8 pl-2 text-sm w-full  border-b border-gray-200 bg-transparent  placeholder:text-gray-300  text-black leading-tight focus:outline-none focus:shadow-outline"
                                                    id="newTaskName"
                                                    name="newTaskName"
                                                    type="text"
                                                    value={
                                                        newTask.tName
                                                            ? newTask.tName
                                                            : ""
                                                    }
                                                    placeholder="Enter New Task Name"
                                                    onChange={(e) =>
                                                        setNewTask({
                                                            ...newTask,
                                                            tName: e.target
                                                                .value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label
                                                    className="block text-gray-700 text-sm font-bold mb-1"
                                                    for="newTaskDesc"
                                                >
                                                    Task Description
                                                </label>
                                                <input
                                                    className="h-8 pl-2 text-sm w-full  border-b border-gray-200 bg-transparent placeholder:text-gray-300  text-black leading-tight focus:outline-none focus:shadow-outline"
                                                    id="newTaskDesc"
                                                    name="newTaskDesc"
                                                    type="text"
                                                    value={
                                                        newTask.tDesc
                                                            ? newTask.tDesc
                                                            : ""
                                                    }
                                                    placeholder="Enter New Task Description"
                                                    onChange={(e) =>
                                                        setNewTask({
                                                            ...newTask,
                                                            tDesc: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-6 ">
                                                <div className="mb-4 w-1/2">
                                                    <label
                                                        className="block text-gray-700 text-sm font-bold mb-1"
                                                        for="newTaskDue"
                                                    >
                                                        Task Due
                                                    </label>
                                                    <DatePickerInput
                                                        placeholder="Select date"
                                                        clearable
                                                        valueFormat="DD MMMM YYYY"
                                                        value={
                                                            newTask.tDue
                                                                ? new Date(
                                                                      newTask.tDue
                                                                  )
                                                                : null
                                                        }
                                                        onChange={(date) =>
                                                            setNewTask({
                                                                ...newTask,
                                                                tDue: date
                                                                    ? date.toISOString()
                                                                    : "",
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="mb-4 w-1/2">
                                                    <label
                                                        className="block text-gray-700 text-sm font-bold mb-1"
                                                        htmlFor="newTaskDue"
                                                    >
                                                        Task Priority
                                                    </label>
                                                    <Select
                                                        placeholder="Select Priority"
                                                        clearable
                                                        value={
                                                            newTask.tPriority ||
                                                            ""
                                                        }
                                                        onChange={(value) =>
                                                            setNewTask({
                                                                ...newTask,
                                                                tPriority:
                                                                    value, // 'value' is a single selected option (string)
                                                            })
                                                        }
                                                        data={[
                                                            {
                                                                value: "None",
                                                                label: "None",
                                                            },
                                                            {
                                                                value: "Low",
                                                                label: "Low",
                                                            },
                                                            {
                                                                value: "Medium",
                                                                label: "Medium",
                                                            },
                                                            {
                                                                value: "High",
                                                                label: "High",
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-4 flex-grow">
                                                <label
                                                    className="block text-gray-700 text-sm font-bold mb-1"
                                                    htmlFor="newTaskDue"
                                                >
                                                    Task Notes
                                                </label>
                                                <Textarea
                                                    value={
                                                        newTask.tNotes
                                                            ? newTask.tNotes
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        setNewTask({
                                                            ...newTask,
                                                            tNotes: e.target
                                                                .value,
                                                        });
                                                    }}
                                                    styles={{
                                                        input: {
                                                            height: "94px", // Set the desired fixed height
                                                        },
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between w-full">
                                            {isEditMode ? (
                                                <button
                                                    type="submit"
                                                    className="flex gap-x-1 text-zinc-900 bg-zinc-900 px-3 py-2 rounded-full items-center text-sm font-semibold tracking-wider"
                                                >
                                                    <p className="text-white tracking-tight">
                                                        Update Task
                                                    </p>
                                                    <div className="">
                                                        <Check
                                                            color="#ffffff"
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </div>
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    className="flex gap-x-1 bg-black text-white px-3 py-2 rounded-full text-sm font-semibold tracking-wider"
                                                >
                                                    <p className="text-white tracking-tight">
                                                        Confirm New Task
                                                    </p>
                                                    <div className="">
                                                        <BetweenHorizonalStart
                                                            color="#ffffff"
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </div>
                                                </button>
                                            )}
                                            {isEditMode && (
                                                <button
                                                    onClick={() => {
                                                        deleteTask();
                                                        setNewTask({});
                                                        closeTaskModal();
                                                    }}
                                                    className="flex gap-x-1 text-zinc-900 bg-zinc-900  px-3 py-2 rounded-full items-center text-sm font-semibold tracking-wider"
                                                >
                                                    <p className="text-white tracking-tight">
                                                        Delete Task
                                                    </p>
                                                    <div className="">
                                                        <Trash2
                                                            color="#ffffff"
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                                {/* Modal Check Form */}
                                <form
                                    onSubmit={submitNewCheck}
                                    className="relative p-8 w-1/2 bg-zinc-900"
                                >
                                    {!isEditMode && (
                                        <div className="absolute flex justify-center items-center top-0 left-0 w-full h-full bg-zinc-900/85 z-[9990]">
                                            <p className="text-white text-sm">
                                                <strong> Note:</strong> Create a
                                                task first to add checks.
                                            </p>
                                        </div>
                                    )}
                                    <div className="mb-4 items">
                                        <div className="flex justify-between">
                                            <label
                                                className="block text-white text-lg font-bold mb-4"
                                                for="newCheckName"
                                            >
                                                Update Check Details
                                            </label>
                                            <div
                                                onClick={() => {
                                                    closeTaskModal();
                                                    setNewTask({});
                                                }}
                                                className="cursor-pointer text-zinc-300 hover:text-white z-[9999]"
                                            >
                                                <X
                                                    size={18}
                                                    strokeWidth={3}
                                                    className="cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <label
                                            className="block text-white text-sm font-bold mb-1"
                                            for="newTaskName"
                                        >
                                            Add New Check
                                        </label>
                                        <div className="flex">
                                            <input
                                                className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-500 bg-transparent mr-2 placeholder:text-gray-400   text-white leading-tight focus:outline-none focus:shadow-outline"
                                                id="newCheckName"
                                                name="newCheckName"
                                                type="text"
                                                required
                                                placeholder="e.g. Call the client, Send an email..."
                                                value={newCheck.cName}
                                                onChange={(e) =>
                                                    setNewCheck({
                                                        ...newCheck,
                                                        cName: e.target.value,
                                                    })
                                                }
                                            />
                                            <button
                                                type="submit"
                                                className="flex  text-xs px-4 h-8 items-center bg-gray-800 hover:bg-gray-700 rounded-full text-white "
                                            >
                                                <Plus
                                                    size={16}
                                                    strokeWidth={1.5}
                                                />{" "}
                                                <p>Add</p>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-x-6 items-end">
                                        <div className="mb-4 w-1/2">
                                            <label
                                                className="block text-white  text-sm font-bold mb-1"
                                                for="newTaskDue"
                                            >
                                                Check Due
                                            </label>
                                            <DatePickerInput
                                                placeholder="Select date"
                                                value={
                                                    newCheck.cDue
                                                        ? new Date(
                                                              newCheck.cDue
                                                          )
                                                        : null
                                                }
                                                clearable
                                                valueFormat="DD MMMM YYYY"
                                                onChange={(date) =>
                                                    setNewCheck({
                                                        ...newCheck,
                                                        cDue: date
                                                            ? date.toISOString()
                                                            : "",
                                                    })
                                                }
                                                styles={{
                                                    input: {
                                                        backgroundColor:
                                                            "#18181B",
                                                        borderColor: "#212c3b",
                                                        color: "#ffffff",
                                                    },
                                                }}
                                            />
                                        </div>

                                        <div className="mb-4 w-1/2">
                                            <label
                                                className="block text-white text-sm font-bold mb-1"
                                                htmlFor="newTaskDue"
                                            >
                                                Check complete?
                                            </label>
                                            <Select
                                                placeholder="Select Status"
                                                clearable
                                                value={
                                                    newCheck.cCompleted === true
                                                        ? "true"
                                                        : newCheck.cCompleted ===
                                                          false
                                                        ? "false"
                                                        : ""
                                                }
                                                onChange={(value) =>
                                                    setNewCheck({
                                                        ...newCheck,
                                                        cCompleted:
                                                            value === "true",
                                                    })
                                                }
                                                data={[
                                                    {
                                                        value: "false",
                                                        label: "Uncompleted",
                                                    },
                                                    {
                                                        value: "true",
                                                        label: "Completed",
                                                    },
                                                ]}
                                                styles={{
                                                    input: {
                                                        backgroundColor:
                                                            "#18181B",
                                                        borderColor: "#212c3b",
                                                        color: "#ffffff",
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className=" px-2 py-2 rounded-md border border-gray-800 overflow-y-auto h-[250px] scrollbar-custom">
                                        {isEditMode ? (
                                            <>
                                                <Reorder.Group
                                                    axis="y"
                                                    values={sortedChecks}
                                                    onReorder={(
                                                        reorderedChecks
                                                    ) => {
                                                        const updatedChecks =
                                                            reorderedChecks.map(
                                                                (
                                                                    check,
                                                                    index
                                                                ) => ({
                                                                    ...check,
                                                                    cOrder:
                                                                        index +
                                                                        1,
                                                                })
                                                            );

                                                        setChecks(
                                                            (prevChecks) => ({
                                                                ...prevChecks,
                                                                [selectedTask]:
                                                                    updatedChecks,
                                                            })
                                                        );

                                                        updateChecksOrderInDatabase(
                                                            selectedBoard,
                                                            updatedChecks
                                                        );
                                                    }}
                                                >
                                                    {checks[selectedTask]?.map(
                                                        (check, index) => (
                                                            <Reorder.Item
                                                                key={check.id}
                                                                value={check}
                                                            >
                                                                <div
                                                                    key={index}
                                                                    onMouseOver={() =>
                                                                        setSelectedCheck(
                                                                            check.id
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex items-start gap-1 px-1 rounded-full justify-between cursor-ns-resize">
                                                                        {editCheck ===
                                                                        check.id ? (
                                                                            <div className="w-full pb-2">
                                                                                <Textarea
                                                                                    autosize="true"
                                                                                    value={
                                                                                        updatedCheck
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        setUpdatedCheck(
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    styles={{
                                                                                        input: {
                                                                                            backgroundColor:
                                                                                                "#18181B",
                                                                                            borderColor:
                                                                                                "#212c3b",
                                                                                            color: "#ffffff",
                                                                                        },
                                                                                        placeholder:
                                                                                            {
                                                                                                color: "#4a4e66", // Placeholder text color (gray)
                                                                                            },
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="">
                                                                                <p
                                                                                    className={`text-[13px] break-words leading-4 ${
                                                                                        check.cCompleted
                                                                                            ? "line-through text-zinc-400"
                                                                                            : "text-white"
                                                                                    }`}
                                                                                >
                                                                                    {
                                                                                        check.cName
                                                                                    }
                                                                                </p>
                                                                                <div className="text-[12px] text-zinc-500 -mt-1">
                                                                                    Due:{" "}
                                                                                    {moment(
                                                                                        check.cDue
                                                                                    ).format(
                                                                                        "DD-MMM-YY"
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex flex-col gap-x-1 gap-y-2 items-center ">
                                                                            <div className="flex gap-x-1 cursor-pointer">
                                                                                <div>
                                                                                    {check.cCompleted ? (
                                                                                        <div
                                                                                            onClick={() =>
                                                                                                toggleCheckCompletion(
                                                                                                    selectedTask,
                                                                                                    check.id,
                                                                                                    check.cCompleted
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
                                                                                            className="text-zinc-400 hover:text-white"
                                                                                            onClick={() =>
                                                                                                toggleCheckCompletion(
                                                                                                    selectedTask,
                                                                                                    check.id,
                                                                                                    check.cCompleted
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Circle
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
                                                                                <div
                                                                                    onClick={() => {
                                                                                        setEditCheck(
                                                                                            check.id
                                                                                        );
                                                                                        setUpdatedCheck(
                                                                                            check.cName
                                                                                        );
                                                                                    }}
                                                                                    className={`${
                                                                                        editCheck ===
                                                                                        check.id
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
                                                                                <div
                                                                                    onClick={() =>
                                                                                        deleteCheck(
                                                                                            check.id
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
                                                                                </div>
                                                                            </div>
                                                                            {editCheck ===
                                                                                check.id && (
                                                                                <button
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.preventDefault();
                                                                                        modifyCheck(
                                                                                            check
                                                                                        );
                                                                                        setEditCheck(
                                                                                            false
                                                                                        );
                                                                                    }}
                                                                                    className="flex  text-xs px-2 h-6 gap-x-0.5 items-center bg-gray-800 hover:bg-gray-700 rounded-full text-white "
                                                                                >
                                                                                    <p>
                                                                                        Save
                                                                                    </p>
                                                                                    <Check
                                                                                        size={
                                                                                            16
                                                                                        }
                                                                                    />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Reorder.Item>
                                                        )
                                                    )}
                                                </Reorder.Group>
                                            </>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </Modal>
                        <Modal
                            size={500}
                            radius={"md"}
                            title={
                                <h1
                                    style={{
                                        fontSize: "1.2rem",
                                        fontWeight: "bold",
                                        paddingLeft: "1rem",
                                        paddingTop: "0.6rem",
                                    }}
                                >
                                    Delete Board
                                </h1>
                            }
                            opened={deleteBoardModal}
                            onClose={() => {
                                closeDeleteBoardModal();
                            }}
                            centered
                            closeOnClickOutside={true}
                        >
                            <div className="px-4">
                                <div className="text-[15.5px] mb-4">
                                    <p className="mb-2">
                                        You are about to delete the board:
                                    </p>
                                    <p className="mb-2">
                                        &quot;<strong>{boardName}</strong>
                                        &quot;
                                    </p>
                                    <p className="">
                                        This action cannot be undone. {"  "}Type
                                        {"  "}
                                        <strong>&apos;Delete&apos;</strong> to
                                        confirm.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pb-4">
                                    <input
                                        type="text"
                                        className="w-full h-9 border border-zinc-400 rounded-full px-4"
                                        onChange={(e) => {
                                            setConfirmDelete(e.target.value);
                                        }}
                                    ></input>
                                    <button
                                        onClick={() => {
                                            if (confirmDelete === "Delete") {
                                                deleteBoard();
                                                closeDeleteBoardModal();
                                            }
                                        }}
                                        className="bg-zinc-900 hover:bg-red-600 text-white text-sm rounded-full px-4 py-2"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </Modal>
                        <Modal
                            size={500}
                            radius={"md"}
                            title={
                                <h1
                                    style={{
                                        fontSize: "1.2rem",
                                        fontWeight: "bold",
                                        paddingLeft: "1rem",
                                        paddingTop: "0.6rem",
                                    }}
                                >
                                    Rename Board
                                </h1>
                            }
                            opened={renameBoardModal}
                            onClose={() => {
                                closeRenameBoardModal();
                            }}
                            centered
                            closeOnClickOutside={true}
                        >
                            <div className="px-4">
                                <div className="text-[15.5px] mb-4">
                                    <p className="mb-2">
                                        Modify the name of the board:
                                    </p>
                                    <p className="mb-2">
                                        &quot;
                                        <strong>{boardName}</strong>&quot;
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pb-4">
                                    <input
                                        type="text"
                                        value={renamedBoard}
                                        onChange={(e) => {
                                            setRenamedBoard(e.target.value);
                                        }}
                                        className="w-full h-9 border border-zinc-400 rounded-full px-4"
                                    ></input>
                                    <button
                                        onClick={() => {
                                            renameBoard(renamedBoard);
                                            closeRenameBoardModal();
                                        }}
                                        className="bg-zinc-900 hover:bg-red-600 text-white text-sm rounded-full px-4 py-2"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center w-full h-full">
                    <ClipLoader
                        color={color}
                        loading={loading}
                        cssOverride={override}
                        size={46}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    />
                </div>
            )}
        </div>
    );
}
