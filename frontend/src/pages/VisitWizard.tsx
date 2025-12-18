import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { X, Check, Search, Plus, Trash2, MapPin, Users, Briefcase, Clock, MessageSquare } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { motion, AnimatePresence } from 'framer-motion';

const VisitWizard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const facilityId = Number(searchParams.get('facilityId'));
    const activityCode = searchParams.get('activity') || 'checkup';
    const [loading, setLoading] = useState(true);
    const [visitId, setVisitId] = useState<number | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    
    // State
    const [transitSelection, setTransitSelection] = useState<Set<number>>(new Set());
    const [transitComment, setTransitComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [tastingGuests, setTastingGuests] = useState([{ id: '1', name: '', contact: '' }]);
    const [tastingFeedback, setTastingFeedback] = useState('');
    const [b2bGuests, setB2bGuests] = useState([{ id: '1', name: '', contact: '', facility: '' }]);
    const [b2bComment, setB2bComment] = useState('');
    const [checkupData, setCheckupData] = useState({ startTime: '', endTime: '', cups: '', feedback: '' });

    useEffect(() => {
        const init = async () => {
            try {
                const pRes = await apiClient.get('/api/products');
                setProducts(pRes.data || []);
                const res = await apiClient.post('/api/visits', {
                    facilityId, type: activityCode,
                    userId: WebApp.initDataUnsafe?.user?.id || 1, 
                    status: 'IN_PROGRESS'
                });
                setVisitId(res.data.id);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        init();
    }, []);

    const handleFinish = async () => {
        if (!visitId) return;
        let finalData: any = {};
        let comment = '';
        if (activityCode === 'transit') { finalData = { products: Array.from(transitSelection) }; comment = transitComment; }
        else if (activityCode === 'tasting') { finalData = { guests: tastingGuests }; comment = tastingFeedback; }
        else if (activityCode === 'training') { finalData = { guests: b2bGuests }; comment = b2bComment; }
        else { finalData = checkupData; comment = checkupData.feedback; }

        await apiClient.patch(`/api/visits/${visitId}`, { status: 'COMPLETED', endedAt: new Date(), comment, data: finalData });
        navigate(-1);
    };

    // Renderers
    const renderTransit = () => {
        const filtered = products.filter(p => p.flavor.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-blue-900"><MapPin /> <div><div className="font-bold">Чек-ин</div><div className="text-xs">Геопозиция сохранена</div></div></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm"><textarea className="w-full bg-gray-50 rounded-xl p-3" placeholder="Что делали?" value={transitComment} onChange={e => setTransitComment(e.target.value)} /></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="relative mb-4"><Search className="absolute left-3 top-3 text-gray-400" /><input className="w-full bg-gray-50 pl-10 p-3 rounded-xl" placeholder="Найти вкус..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                    <div className="flex flex-wrap gap-2">{filtered.map(p => (
                        <button key={p.id} onClick={() => { const s = new Set(transitSelection); if(s.has(p.id)) s.delete(p.id); else s.add(p.id); setTransitSelection(s); }} 
                        className={`px-3 py-2 rounded-xl text-xs font-bold border ${transitSelection.has(p.id) ? 'bg-black text-white' : 'bg-white'}`}>{p.flavor}</button>
                    ))}</div>
                </div>
            </div>
        );
    };

    const renderTasting = () => (
        <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">Гости</h3>
                {tastingGuests.map((g, i) => (
                    <div key={g.id} className="bg-gray-50 p-3 rounded-xl mb-2"><input placeholder="Имя" className="bg-transparent w-full font-bold mb-1" value={g.name} onChange={e => {const n=[...tastingGuests]; n[i].name=e.target.value; setTastingGuests(n)}}/><input placeholder="Контакты" className="bg-transparent w-full text-xs" value={g.contact} onChange={e => {const n=[...tastingGuests]; n[i].contact=e.target.value; setTastingGuests(n)}}/></div>
                ))}
                <button onClick={() => setTastingGuests([...tastingGuests, {id: Date.now().toString(), name:'', contact:''}])} className="w-full border border-dashed p-3 rounded-xl text-gray-500 font-bold flex justify-center gap-2"><Plus/> Добавить гостя</button>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm"><textarea className="w-full bg-gray-50 rounded-xl p-3" placeholder="Общий фидбек..." value={tastingFeedback} onChange={e => setTastingFeedback(e.target.value)}/></div>
        </div>
    );

    const renderB2B = () => (
        <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm"><h3 className="font-bold mb-4">Участники B2B</h3>
                {b2bGuests.map((g, i) => (
                    <div key={g.id} className="bg-gray-50 p-3 rounded-xl mb-2"><input placeholder="Имя / Должность" className="bg-transparent w-full font-bold mb-1" value={g.name} onChange={e => {const n=[...b2bGuests]; n[i].name=e.target.value; setB2bGuests(n)}}/><input placeholder="Заведение (откуда)" className="bg-transparent w-full text-xs" value={g.facility} onChange={e => {const n=[...b2bGuests]; n[i].facility=e.target.value; setB2bGuests(n)}}/></div>
                ))}
                <button onClick={() => setB2bGuests([...b2bGuests, {id: Date.now().toString(), name:'', contact:'', facility:''}])} className="w-full border border-dashed p-3 rounded-xl text-gray-500 font-bold flex justify-center gap-2"><Plus/> Добавить</button>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm"><textarea className="w-full bg-gray-50 rounded-xl p-3" placeholder="Итоги..." value={b2bComment} onChange={e => setB2bComment(e.target.value)}/></div>
        </div>
    );

    const renderCheckup = () => (
        <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm"><div className="flex gap-4"><input type="time" className="bg-gray-50 w-full p-3 rounded-xl" value={checkupData.startTime} onChange={e => setCheckupData({...checkupData, startTime: e.target.value})}/><input type="time" className="bg-gray-50 w-full p-3 rounded-xl" value={checkupData.endTime} onChange={e => setCheckupData({...checkupData, endTime: e.target.value})}/></div><input type="number" placeholder="Продано чашек" className="w-full bg-gray-50 p-3 rounded-xl mt-4" value={checkupData.cups} onChange={e => setCheckupData({...checkupData, cups: e.target.value})}/></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm"><textarea className="w-full bg-gray-50 rounded-xl p-3" placeholder="Отзывы гостей..." value={checkupData.feedback} onChange={e => setCheckupData({...checkupData, feedback: e.target.value})}/></div>
        </div>
    );

    if (loading) return <div className="h-screen flex justify-center items-center">Загрузка...</div>;

    return (
        <div className="fixed inset-0 bg-[#F2F3F7] flex flex-col">
            <div className="bg-white px-4 pt-4 pb-2 flex justify-between items-center"><h1 className="font-bold text-lg">Визит</h1><button onClick={()=>navigate(-1)} className="bg-gray-100 rounded-full w-8 h-8 flex justify-center items-center"><X size={18}/></button></div>
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {activityCode === 'transit' && renderTransit()}
                {activityCode === 'tasting' && renderTasting()}
                {activityCode === 'training' && renderB2B()}
                {activityCode === 'checkup' && renderCheckup()}
            </div>
            <div className="bg-white p-4 pb-8"><button onClick={handleFinish} className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-bold flex justify-center gap-2"><Check/> Завершить</button></div>
        </div>
    );
};
export default VisitWizard;