interface Props {
    startTime: string;
    endTime: string;
    cups: string;
    comment: string;
    onChange: (field: 'startTime' | 'endTime' | 'cups' | 'comment', value: string) => void;
    onSubmit: () => void;
}

export const OpenShiftForm = ({ startTime, endTime, cups, comment, onChange, onSubmit }: Props) => {
    return (
        <div className="space-y-5">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Начало смены</label>
                <input
                    type="time"
                    value={startTime}
                    onChange={(e) => onChange('startTime', e.target.value)}
                    className="w-full p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500"
                />
                <label className="block text-xs font-bold text-gray-500 uppercase">Конец смены</label>
                <input
                    type="time"
                    value={endTime}
                    onChange={(e) => onChange('endTime', e.target.value)}
                    className="w-full p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500"
                />
                <label className="block text-xs font-bold text-gray-500 uppercase">Сколько чашек отдали?</label>
                <input
                    type="number"
                    min="0"
                    value={cups}
                    onChange={(e) => onChange('cups', e.target.value)}
                    placeholder="Например, 25"
                    className="w-full p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500"
                />
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Комментарий</label>
                <textarea
                    value={comment}
                    onChange={(e) => onChange('comment', e.target.value)}
                    placeholder="Как прошла смена, задачи, итоги"
                    className="w-full h-28 p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500 resize-none"
                />
            </div>

            <button
                onClick={onSubmit}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition"
            >
                Далее
            </button>
        </div>
    );
};
