import React from "react";
import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { db } from "../../src/app/firebase/config";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    writeBatch,
} from "firebase/firestore";
import DateFormatter from "../functional/dateFormatter";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Progress } from "@mantine/core";
import { auth } from "../../src/app/firebase/config";
import {
    ChevronsDownUp,
    ChevronsUpDown,
    Circle,
    CircleCheck,
    CircleX,
    EllipsisVertical,
    GalleryHorizontalEnd,
    Grip,
    Lock,
    LockOpen,
    MoveHorizontal,
    Plus,
    PlusIcon,
    Trash2,
    X,
} from "lucide-react";

export default function Dashboard(user) {
    const [taskModal, { open: openTaskModal, close: closeTaskModal }] =
        useDisclosure(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [boardsLocked, setBoardsLocked] = useState(true);
    const [dragBoard, setDragBoard] = useState();

    const [checkListOpen, setCheckListOpen] = useState({});
    const [modalTitle, setModalTitle] = useState("Add New Board");
    const [addBoard, setAddBoard] = useState(false);

    const [boards, setBoards] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [checks, setChecks] = useState([]);

    const [newTask, setNewTask] = useState({
        tName: "",
        tDesc: "",
        tDue: "",
        tCreated: "",
        tPriority: "",
        tCompleted: "",
    });

    const [newCheck, setNewCheck] = useState({
        cName: "",
        cDue: "",
        cCreated: "",
        cCompleted: "",
    });

    const [selectedBoard, setSelectedBoard] = useState();
    const [selectedTask, setSelectedTask] = useState();
    const [selectedCheck, setSelectedCheck] = useState();

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
    };

    useEffect(() => {
        getProjectData();
    }, []);

    const fetchBoards = async () => {
        const boardsCollection = collection(
            db,
            "userData",
            auth.currentUser.uid,
            "boards"
        );
        const boardsSnapshot = await getDocs(boardsCollection);
        return boardsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));
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

    const toggleCheckListOpen = (taskId) => {
        setCheckListOpen((prevState) => ({
            ...prevState,
            [taskId]: !prevState[taskId],
        }));
    };

    const handleEditTask = (task) => {
        setNewTask({
            tName: task.tName,
            tDesc: task.tDesc,
            tDue: task.tDue,
            tPriority: task.tPriority,
            tCompleted: task.tCompleted,
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
                    tDesc: newTask.tDesc,
                    tDue: newTask.tDue,
                    tCreated: new Date().toISOString(),
                    tPriority: newTask.tPriority,
                    tCompleted: true,
                    tOrder: nextTOrder,
                }
            );

            setNewTask({
                tName: "",
                tDesc: "",
                tDue: "",
                tCreated: "",
                tPriority: "",
                tCompleted: "",
            });
            closeTaskModal();
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        fetchTasks(selectedBoard);
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
            console.log("Document successfully deleted!");
            setNewTask({});
            closeTaskModal();
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
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

    const BoardsComponent = ({ board }) => {
        return (
            <div>
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
                                        className="absolute cursor-pointer w-full h-full bg-zinc-100/90 border-zinc-200 border pt-10 "
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
                                <p className="text-zinc-900 text-lg font-semibold  pl-1">
                                    {board.bName}
                                </p>
                            </div>
                            <div className="flex gap-x-1">
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setSelectedBoard(board.id);
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
                    <div
                        onClick={() => {
                            setIsEditMode(true);
                            setSelectedBoard(board.id);
                            setSelectedTask(task.id);
                            setModalTitle("Update Task Details");
                            handleEditTask(task);
                        }}
                        className="text-zinc-300 cursor-pointer font-semibold tracking-wider"
                    >
                        <EllipsisVertical size={20} strokeWidth={1.5} />
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex ">
                        <div className="flex items-center ">
                            <p className="text-zinc-300 text-sm">Progress</p>
                        </div>

                        {checks[task.id] && checks[task.id].length > 0 ? (
                            <div>
                                {checkListOpen[task.id] ? (
                                    <button
                                        onClick={() =>
                                            toggleCheckListOpen(task.id)
                                        }
                                        className=" text-zinc-300 mt-2 h-[26px]  rounded-full text-sm font-semibold"
                                    >
                                        <ChevronsDownUp
                                            size={20}
                                            strokeWidth={2}
                                        />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            toggleCheckListOpen(task.id)
                                        }
                                        className=" text-zinc-300  mt-2 h-[26px] rounded-full text-sm font-semibold"
                                    >
                                        <ChevronsUpDown
                                            size={20}
                                            strokeWidth={2}
                                        />
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                    <div className="text-zinc-300  text-md">
                        {checks[task.id]?.filter((check) => check.cCompleted)
                            .length || 0}{" "}
                        / {checks[task.id]?.length || 0}
                    </div>
                </div>
                <div className={` ${!boardsLocked && "opacity-5"} mb-2`}>
                    <Progress
                        color="#DBDEE0"
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
                {checkListOpen[task.id] ? (
                    <div className="mb-2 flex flex-col rounded-md  py-1 ">
                        {checks[task.id]
                            ?.sort((a, b) => a.cOrder - b.cOrder) // Sort checks by cOrder
                            .map((check) => (
                                <div key={check.id} className="">
                                    <div className="flex items-center gap-1 py-0.5 rounded-full justify-between">
                                        <p
                                            className={`truncate ${
                                                check.cCompleted
                                                    ? "line-through text-zinc-400"
                                                    : "text-text"
                                            }`}
                                        >
                                            {check.cName}
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
                                    <div className="text-xs text-zinc-300 px-3 italic -mt-1.5">
                                        Due: {check.cDue}
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : null}

                <div className="flex text-text">
                    <div className="text-zinc-800 bg-zinc-50 text-xs p-1 px-2 rounded-md">
                        <DateFormatter className="" date={task?.tDue} />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div>
            {/* Boards Nav */}
            <div className="mb-4">
                <div className="flex justify-between">
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
                                onClick={() => setBoardsLocked(false)}
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
                                onClick={() => setBoardsLocked(true)}
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
                                class="newBoard"
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
                                />
                                <button
                                    type="submit"
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
                            <button className="bg-zinc-900 whitespace-nowrap h-[34px] text-white px-4 my-2.5 rounded-full font-semibold tracking-wide">
                                New Board
                            </button>
                        )}
                    </div>
                </div>
                <div className="h-[2px] bg-zinc-300 -mt-[2px] z-0"></div>
            </div>
            {boardsLocked ? (
                <div className="flex gap-4 overflow-x-auto">
                    {boards
                        .sort((a, b) => a.bOrder - b.bOrder)
                        .map((board, index) => (
                            <BoardsComponent board={board} />
                        ))}
                </div>
            ) : (
                <Reorder.Group
                    axis="x"
                    values={boards}
                    onReorder={(boards) => {
                        const updatedBoards = boards.map((board, index) => ({
                            ...board,
                            bOrder: index + 1,
                        }));
                        setBoards(updatedBoards);
                        updateBoardsOrderinDatabase(updatedBoards);
                    }}
                >
                    <div className="flex gap-4 overflow-x-auto">
                        {boards
                            .sort((a, b) => a.bOrder - b.bOrder)
                            .map((board, index) => (
                                <Reorder.Item key={board.id} value={board}>
                                    <BoardsComponent board={board} />
                                </Reorder.Item>
                            ))}
                    </div>
                </Reorder.Group>
            )}
            <Modal
                size={1000}
                radius={"md"}
                title={
                    <h1
                        style={{
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                            paddingLeft: "1.9rem",
                            paddingTop: "1rem",
                        }}
                    >
                        {modalTitle}
                    </h1>
                }
                opened={taskModal}
                onClose={() => {
                    closeTaskModal();
                    setNewTask({});
                }}
                centered
                closeOnClickOutside={true}
            >
                <div className="flex gap-10 px-8 pb-8 ">
                    {/* Modal Task Form  */}
                    <form
                        class="newTask"
                        onSubmit={isEditMode ? submitEditTask : submitNewTask}
                        className="border-zinc-100  w-1/2 mt-[37px]"
                    >
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-1"
                                for="newTaskName"
                            >
                                Task Name
                            </label>
                            <input
                                className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-200 bg-transparent mr-2 placeholder:text-gray-300  text-black leading-tight focus:outline-none focus:shadow-outline"
                                id="newTaskName"
                                name="newTaskName"
                                type="text"
                                value={newTask.tName ? newTask.tName : ""}
                                placeholder="Enter New Task Name"
                                onChange={(e) =>
                                    setNewTask({
                                        ...newTask,
                                        tName: e.target.value,
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
                                className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-200 bg-transparent mr-2 placeholder:text-gray-300  text-black leading-tight focus:outline-none focus:shadow-outline"
                                id="newTaskDesc"
                                name="newTaskDesc"
                                type="text"
                                value={newTask.tDesc ? newTask.tDesc : ""}
                                placeholder="Enter New Task Description"
                                onChange={(e) =>
                                    setNewTask({
                                        ...newTask,
                                        tDesc: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-1"
                                for="newTaskDue"
                            >
                                Task Due
                            </label>
                            <input
                                className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-200 bg-transparent mr-2 placeholder:text-gray-300  text-black leading-tight focus:outline-none focus:shadow-outline"
                                id="newTaskDue"
                                name="newTaskDue"
                                type="date"
                                value={newTask.tDue ? newTask.tDue : ""}
                                onChange={(e) =>
                                    setNewTask({
                                        ...newTask,
                                        tDue: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-1"
                                htmlFor="newTaskDue"
                            >
                                Priority
                            </label>
                            <select
                                className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-200 bg-transparent mr-2 placeholder:text-gray-300  text-black leading-tight focus:outline-none focus:shadow-outline"
                                id="newTaskDue"
                                name="newTaskDue"
                                value={
                                    newTask.tPriority ? newTask.tPriority : ""
                                }
                                onChange={(e) =>
                                    setNewTask({
                                        ...newTask,
                                        tPriority: e.target.value,
                                    })
                                }
                                required
                            >
                                <option value="">Select Priority</option>
                                <option value="None">None</option>
                                <option value="Low">Low Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="High">High Priority</option>
                            </select>
                        </div>
                        {isEditMode ? (
                            <button
                                type="submit"
                                className="bg-black text-white px-3 py-2 rounded-full text-xs font-semibold tracking-wider"
                            >
                                Update Task
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="bg-black text-white px-3 py-2 rounded-full text-xs font-semibold tracking-wider"
                            >
                                Submit Task
                            </button>
                        )}
                        <button
                            onClick={deleteTask}
                            className="flex gap-x-1 text-zinc-900 bg-red-100  px-3 py-2 rounded-full items-center absolute bottom-8 left-11  text-sm font-semibold tracking-wider"
                        >
                            <div className="">
                                <Trash2
                                    color="#EF4444"
                                    size={16}
                                    strokeWidth={1.5}
                                />
                            </div>
                            <p className="text-zinc-900 tracking-tight">
                                Delete Task
                            </p>
                        </button>
                    </form>
                    {/* Modal Check Form */}
                    <form
                        onSubmit={submitNewCheck}
                        className="relative p-8 w-1/2 bg-zinc-900 rounded-md"
                    >
                        <div className="mb-4 items">
                            <label
                                className="block text-white text-sm font-bold mb-1"
                                for="newCheckName"
                            >
                                New Check Name
                            </label>
                            <div className="flex">
                                <input
                                    className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-500 bg-transparent mr-2 placeholder:text-gray-600  text-white leading-tight focus:outline-none focus:shadow-outline"
                                    id="newCheckName"
                                    name="newCheckName"
                                    type="text"
                                    required
                                    placeholder="e.g. Call the client, Send an email..."
                                    onChange={(e) =>
                                        setNewCheck({
                                            ...newCheck,
                                            cName: e.target.value,
                                        })
                                    }
                                />
                                <button
                                    type="submit"
                                    className="flex  text-xs px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white "
                                >
                                    <Plus size={16} strokeWidth={1.5} />{" "}
                                    <p>Add</p>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-x-6 items-end">
                            <div className="mb-4 w-1/2">
                                <label
                                    className="block text-white text-sm font-bold mb-1"
                                    for="newTaskDue"
                                >
                                    Check Due
                                </label>
                                <input
                                    className="py-0.5 pl-2 text-sm w-full mb-0.5  appearance-none border-b border-gray-700 bg-transparent mr-2 placeholder:text-gray-600  text-white leading-tight focus:outline-none focus:shadow-outline"
                                    id="newTaskDue"
                                    name="newTaskDue"
                                    type="date"
                                    placeholder="Select Due Date"
                                    onChange={(e) =>
                                        setNewCheck({
                                            ...newCheck,
                                            cDue: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="mb-4 w-1/2">
                                <label
                                    className="block text-white text-sm font-bold mb-1"
                                    htmlFor="newTaskDue"
                                >
                                    Check complete?
                                </label>
                                <select
                                    id="checkCompleted"
                                    name="checkCompleted"
                                    className="py-0.5 pl-2 text-sm w-full mb-0.5 text-white appearance-none border-b border-gray-700 bg-transparent mr-2 placeholder:text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
                                    onChange={(e) =>
                                        setNewCheck({
                                            ...newCheck,
                                            cCompleted:
                                                e.target.value === "true",
                                        })
                                    }
                                >
                                    <option
                                        value={false}
                                        className="text-black"
                                    >
                                        Uncompleted
                                    </option>
                                    <option value={true} className="text-black">
                                        Complete
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div className=" px-2 py-2 rounded-md border border-gray-800 overflow-y-auto h-[250px]">
                            {isEditMode ? (
                                <>
                                    <Reorder.Group
                                        axis="y"
                                        values={checks[selectedTask].sort(
                                            (a, b) => a.cOrder - b.cOrder
                                        )}
                                        onReorder={(reorderedChecks) => {
                                            const updatedChecks =
                                                reorderedChecks.map(
                                                    (check, index) => ({
                                                        ...check,
                                                        cOrder: index + 1,
                                                    })
                                                );

                                            setChecks((prevChecks) => ({
                                                ...prevChecks,
                                                [selectedTask]: updatedChecks,
                                            }));

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
                                                            <div className="">
                                                                <p
                                                                    className={`truncate text-sm max-w-[270px]  ${
                                                                        check.cCompleted
                                                                            ? "line-through text-zinc-500"
                                                                            : "text-white"
                                                                    }`}
                                                                >
                                                                    {
                                                                        check.cName
                                                                    }
                                                                </p>
                                                                <div className="text-xs text-zinc-600 -mt-1">
                                                                    Due:{" "}
                                                                    {check.cDue}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-x-1 items-center cursor-pointer">
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
                                                                            onClick={() =>
                                                                                toggleCheckCompletion(
                                                                                    selectedTask,
                                                                                    check.id,
                                                                                    check.cCompleted
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
            {/* <button onClick={() => console.log()} className="bg-blue-500 p-4">
        TEST
      </button> */}
        </div>
    );
}