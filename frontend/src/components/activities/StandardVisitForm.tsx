interface Props {
    note: string;
    onChange: (next: string) => void;
    onSubmit: () => void;
}

export const StandardVisitForm = ({ note, onChange, onSubmit }: Props) => {
    return (
        <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Общее впечатление</div>
                <textarea
                    value={note}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Коротко: что увидели, с кем говорили, договоренности"
                    className="w-full h-32 p-4 rounded-2xl border border-gray-100 focus:ring-2 ring-blue-500 shadow-inner resize-none"
                />
            </div>

            <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-2xl p-4">
                <div className="font-semibold mb-1">Совет</div>
                <div>2–3 тезиса достаточно. Фото и глубжее описание можно оставить в комментарии на следующем шаге.</div>
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
