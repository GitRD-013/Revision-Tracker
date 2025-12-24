import React, { useState, useMemo } from 'react';
import { Topic, RevisionStatus } from '../types';
import { Link } from 'react-router-dom';

interface CalendarPageProps {
    topics: Topic[];
    onStatusUpdate: (topicId: string, revId: string, status: RevisionStatus) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ topics, onStatusUpdate }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today); // For month navigation
    const [selectedDate, setSelectedDate] = useState<Date>(today); // For selection

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Prepare events data
    const eventsMap = useMemo(() => {
        const map: Record<string, { type: 'revision' | 'added', topic: Topic, status?: RevisionStatus, revId?: string }[]> = {};

        topics.forEach(topic => {
            // Revisions
            topic.revisions.forEach(rev => {
                const dateKey = rev.date;
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push({ type: 'revision', topic, status: rev.status, revId: rev.id });
            });

            // Added Date
            const addedKey = topic.addedDate?.split('T')[0];
            if (addedKey) {
                if (!map[addedKey]) map[addedKey] = [];
                map[addedKey].push({ type: 'added', topic });
            }
        });
        return map;
    }, [topics]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    // Generate Calendar Grid
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const daysArray = [];

    // Padding for prev month
    for (let i = 0; i < firstDay; i++) {
        daysArray.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
    }

    const selectedDateKey = formatDateKey(selectedDate);
    const selectedEvents = eventsMap[selectedDateKey] || [];

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Helper for dot color
    const getDotColor = (event: { type: 'revision' | 'added', status?: RevisionStatus }) => {
        if (event.type === 'added') return 'bg-blue-500';
        if (event.status === RevisionStatus.COMPLETED) return 'bg-green-500';
        // Pending or Missed
        return 'bg-red-500';
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
                    <p className="text-gray-500 mt-1">Track your revisions and topic history</p>
                </div>
                <button
                    onClick={handleToday}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    Today
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                    {/* Header: Month Year Navigation */}
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h3 className="text-xl font-bold text-gray-900">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-4 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 md:gap-4">
                        {daysArray.map((day, index) => {
                            if (day === null) return <div key={`empty-${index}`} />;

                            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const dateKey = formatDateKey(currentDayDate);
                            const isSelected = dateKey === formatDateKey(selectedDate);
                            const isToday = dateKey === formatDateKey(today);
                            const dayEvents = eventsMap[dateKey] || [];
                            const hasEvents = dayEvents.length > 0;

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        aspect-square rounded-full md:rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 p-1
                                        ${isSelected ? 'bg-primary text-white shadow-md scale-105' : 'bg-indigo-50/30 text-gray-700 hover:bg-indigo-50 hover:scale-[1.05] hover:shadow-sm'}
                                        ${isToday && !isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                                    `}
                                >
                                    <span className={`text-sm md:text-base font-semibold ${isSelected ? 'text-white' : 'text-gray-900'} leading-none mb-0.5`}>{day}</span>

                                    {/* Event Dots */}
                                    {hasEvents && (
                                        <div className="flex flex-col items-center gap-0.5 w-full">
                                            <div className="flex gap-0.5 md:gap-1 justify-center flex-wrap max-w-full px-1">
                                                {dayEvents.slice(0, 3).map((ev, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white/70' : getDotColor(ev)}`}
                                                    ></div>
                                                ))}
                                            </div>
                                            {dayEvents.length > 3 && (
                                                <div className={`text-[8px] md:text-[9px] font-bold leading-none ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                                                    +{dayEvents.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar: Details for Selected Date */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary font-bold">
                                <span className="text-xl">{selectedDate.getDate()}</span>
                                <span className="text-[10px] uppercase">{monthNames[selectedDate.getMonth()].slice(0, 3)}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Events</h3>
                                <p className="text-gray-500 text-xs">
                                    {selectedEvents.length} recorded {selectedEvents.length === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                        </div>

                        {selectedEvents.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-50">
                                <div className="text-4xl mb-2">📅</div>
                                <p className="text-gray-500 font-medium">No events for this date</p>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                {selectedEvents.map((event, idx) => {
                                    const isRevision = event.type === 'revision';

                                    // Logic: Show completion only if date <= today
                                    // Compare date strings YYYY-MM-DD
                                    const eventDateStr = selectedDateKey; // The Key IS the date string
                                    const todayStr = formatDateKey(today);
                                    const isFuture = eventDateStr > todayStr;
                                    const canComplete = !isFuture;
                                    const isCompleted = event.status === RevisionStatus.COMPLETED;

                                    return (
                                        <Link
                                            to={`/topic/${event.topic.id}`}
                                            key={`${event.topic.id}-${idx}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group relative"
                                        >
                                            <div className={`shrink-0 w-2 h-2 rounded-full ${getDotColor(event)}`}></div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{event.topic.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{event.type}</span>
                                                    {event.status && (
                                                        <span className={`uppercase font-bold text-[10px] ${event.status === RevisionStatus.COMPLETED ? 'text-green-600' : 'text-red-500'
                                                            }`}>
                                                            {event.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Checkbox */}
                                            {/* Logic: 
                                                - If status is PENDING/MISSED: Show ONLY if !isFuture (canComplete)
                                                - If status is COMPLETED: Always show (to allow Undo/Uncheck)
                                            */}
                                            {isRevision && event.revId && (canComplete || isCompleted) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onStatusUpdate(
                                                            event.topic.id,
                                                            event.revId!,
                                                            isCompleted ? RevisionStatus.PENDING : RevisionStatus.COMPLETED
                                                        );
                                                    }}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm shrink-0 ${isCompleted
                                                        ? 'bg-green-500 text-white shadow-md'
                                                        : 'bg-gray-100 hover:bg-green-500 hover:text-white text-gray-400'
                                                        }`}
                                                    title={isCompleted ? "Mark as Pending" : "Mark as Done"}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
