import React, { useState, useEffect } from "react";

export default function DashboardWithMetrics(user) {
    const [boards, setBoards] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [checks, setChecks] = useState([]);

    const fetchCounts = async () => {
        try {
            // Fetch boards data
            const boardsCollection = collection(
                db,
                "userData",
                auth.currentUser.uid,
                "boards"
            );
            const boardsSnapshot = await getDocs(boardsCollection);
            const boardsData = boardsSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setBoards(boardsData);

            let taskCount = 0;
            let checkCount = 0;

            for (const board of boardsData) {
                const tasksCollection = collection(
                    db,
                    "userData",
                    auth.currentUser.uid,
                    "boards",
                    board.id,
                    "tasks"
                );
                const tasksSnapshot = await getDocs(tasksCollection);
                const tasksData = tasksSnapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                taskCount += tasksData.length;

                for (const task of tasksData) {
                    const checksCollection = collection(
                        db,
                        "userData",
                        auth.currentUser.uid,
                        "boards",
                        board.id,
                        "tasks",
                        task.id,
                        "checks"
                    );
                    const checksSnapshot = await getDocs(checksCollection);
                    const checksData = checksSnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    }));
                    checkCount += checksData.length;
                }
            }

            setTasks(taskCount);
            setChecks(checkCount);
        } catch (error) {
            console.error("Error fetching counts:", error);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    return (
        <div className="w-full h-screen">
            {/* Metrics Section */}
            <div className="p-4 bg-gray-100 rounded-lg shadow-md mb-4">
                <h2 className="text-2xl font-bold mb-2">Project Metrics</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded shadow text-center">
                        <h3 className="text-lg font-semibold">Boards</h3>
                        <p className="text-2xl font-bold text-blue-500">
                            {boards.length}
                        </p>
                    </div>
                    <div className="p-4 bg-white rounded shadow text-center">
                        <h3 className="text-lg font-semibold">Tasks</h3>
                        <p className="text-2xl font-bold text-green-500">
                            {tasks}
                        </p>
                    </div>
                    <div className="p-4 bg-white rounded shadow text-center">
                        <h3 className="text-lg font-semibold">Checks</h3>
                        <p className="text-2xl font-bold text-purple-500">
                            {checks}
                        </p>
                    </div>
                </div>
            </div>

            <Dashboard user={user} />
        </div>
    );
}
