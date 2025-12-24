import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Topic, RevisionStatus } from '../types';

// Helper component to handle auto-scrolling
// Defined before usage to avoid ReferenceError
const ScrollableContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to end (right) on mount
        if (scrollRef.current) {
            // Use timeout to ensure layout is calculated
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
                }
            }, 0);
        }
    }, []);

    return (
        <div ref={scrollRef} className="overflow-x-auto pb-2 custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {children}
        </div>
    );
};

interface HeatmapCalendarProps {
    topics: Topic[];
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ topics }) => {
    const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; rect: DOMRect } | null>(null);

    const { calendarData } = useMemo(() => {
        const data: Record<string, number> = {};

        topics.forEach(topic => {
            topic.revisions.forEach(rev => {
                if (rev.status === RevisionStatus.COMPLETED) {
                    data[rev.date] = (data[rev.date] || 0) + 1;
                }
            });
        });

        return { calendarData: data };
    }, [topics]);

    // Generate last 365 days
    const days = useMemo(() => {
        const d = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            d.push(date.toISOString().split('T')[0]);
        }
        return d;
    }, []);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-indigo-50/50';
        if (count === 1) return 'bg-indigo-200';
        if (count <= 3) return 'bg-indigo-300';
        if (count <= 5) return 'bg-indigo-400';
        return 'bg-indigo-600';
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Learning Activity</h3>
            <ScrollableContainer>
                <div className="flex gap-1 min-w-max">
                    {/* We'll render columns for weeks. 365 days is roughly 52 weeks */}
                    {Array.from({ length: 53 }).map((_, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-1">
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const dayOfYearIndex = weekIndex * 7 + dayIndex;
                                if (dayOfYearIndex >= days.length) return null;

                                const dateStr = days[dayOfYearIndex];
                                const count = calendarData[dateStr] || 0;

                                return (
                                    <div
                                        key={dateStr}
                                        className={`w-3 h-3 rounded-sm ${getColor(count)} transition-all duration-200 hover:scale-150 hover:z-10 cursor-pointer`}
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredCell({ date: dateStr, count, rect });
                                        }}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </ScrollableContainer>

            <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-400">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-indigo-50/50"></div>
                <div className="w-3 h-3 rounded-sm bg-indigo-200"></div>
                <div className="w-3 h-3 rounded-sm bg-indigo-400"></div>
                <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
                <span>More</span>
            </div>

            {hoveredCell && createPortal(
                <div
                    className="fixed z-[9999] bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 transition-opacity animate-in fade-in duration-200"
                    style={{
                        top: hoveredCell.rect.top - 40,
                        left: hoveredCell.rect.left + hoveredCell.rect.width / 2
                    }}
                >
                    <div className="font-semibold whitespace-nowrap">
                        {new Date(hoveredCell.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    {hoveredCell.count > 0 && (
                        <div className="text-gray-300 text-[10px] mt-0.5 text-center">
                            {hoveredCell.count} revision{hoveredCell.count !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default HeatmapCalendar;
