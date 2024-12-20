import React from "react";
import {
    Circle,
    CirclePlus,
    ListPlus,
    Settings,
    Settings2,
} from "lucide-react";

export default function Dashboard() {
    return (
        <div className="panel">
            <div className="flex items-center justify-between">
                <p className="text-text text-xl flex mb-2">Projects</p>
                <div className="flex gap-1 items-center">
                    <Settings color="#F87315" size={26} strokeWidth={1.5} />
                    <Settings2 color="#F87315" size={26} strokeWidth={1.5} />
                </div>
            </div>
            {/* // Add projects here */}
            <div className=" w-fit p-2 min-w-[300px] shadow-md shadow-black/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-text text-base font-bold">
                        Project Name
                    </p>
                    <div className="flex text-xs gap-x-1 items-center">
                        <p className="text-primary">Add Task</p>
                        <CirclePlus
                            color="#F87315"
                            size={20}
                            strokeWidth={1.5}
                        />
                    </div>
                </div>
                <div className="">
                    <div className="text-text">Task 1</div>
                    <div className="text-text">Task 2</div>
                    <div className="text-text">Task 3</div>
                    <div className="text-text">Task 4</div>
                    <div className="text-text">Task 5</div>
                </div>
            </div>
        </div>
    );
}
