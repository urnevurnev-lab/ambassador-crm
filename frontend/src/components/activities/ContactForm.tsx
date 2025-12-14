interface Props {
    contacts: string;
    onContactsChange: (value: string) => void;
    comment: string;
    onCommentChange: (value: string) => void;
    onSubmit: () => void;
    title?: string;
}

export const ContactForm = ({ contacts, onContactsChange, comment, onCommentChange, onSubmit, title }: Props) => {
    return (
        <div className="space-y-5">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <div className="text-lg font-bold">{title || 'Контакты участников'}</div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Контакты участников/ЛПР</label>
                <input
                    value={contacts}
                    onChange={(e) => onContactsChange(e.target.value)}
                    placeholder="Имя, роль, телефон/телеграм"
                    className="w-full p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500"
                />
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Комментарий</label>
                <textarea
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    placeholder="Кратко: что обсуждали, договоренности"
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
