import { Topic, Revision, RevisionStatus } from '../types';

export const generateRevisions = (startDate: string, intervals: number[]): Revision[] => {
    return intervals.map((days) => {
        const [y, m, d] = startDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + days); // Add interval days to start date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return {
            id: crypto.randomUUID(),
            date: `${year}-${month}-${day}`,
            status: RevisionStatus.PENDING
        };
    });
};

export const updateTopicRevisions = (
    topic: Topic,
    revId: string,
    newStatus: RevisionStatus,
    settings: { missedStrategy: 'shift' | 'static' | 'double' }
): Topic => {
    const today = new Date().toISOString().split('T')[0];
    const revisionIndex = topic.revisions.findIndex(r => r.id === revId);
    if (revisionIndex === -1) return topic;

    const revision = topic.revisions[revisionIndex];
    let updatedRevisions = [...topic.revisions];

    // Update the status of the target revision
    updatedRevisions[revisionIndex] = { ...revision, status: newStatus };

    // LOGIC: Shift Dates if Strategy is 'shift'
    // Condition: We are completing a revision that was due in the past (Late)
    if (
        newStatus === RevisionStatus.COMPLETED &&
        settings.missedStrategy === 'shift' &&
        revision.date < today
    ) {
        // Calculate delay in days
        const scheduledDate = new Date(revision.date);
        const completionDate = new Date(today);
        const diffTime = Math.abs(completionDate.getTime() - scheduledDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            // Shift all *subsequent* PENDING revisions by diffDays
            for (let i = revisionIndex + 1; i < updatedRevisions.length; i++) {
                const nextRev = updatedRevisions[i];
                if (nextRev.status === RevisionStatus.PENDING) {
                    const nextDate = new Date(nextRev.date);
                    nextDate.setDate(nextDate.getDate() + diffDays);

                    const y = nextDate.getFullYear();
                    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
                    const d = String(nextDate.getDate()).padStart(2, '0');

                    updatedRevisions[i] = { ...nextRev, date: `${y}-${m}-${d}` };
                }
            }
        }
    }

    return { ...topic, revisions: updatedRevisions };
};
