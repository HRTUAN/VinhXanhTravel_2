
import React, { useState, useEffect } from 'react';
import { UserData, CheckPrizeResponse } from '../types';
import { getSetupData, checkPrize } from '../services/api';

interface Props {
  onSubmit: (data: UserData) => void;
  isLoading: boolean;
  serverError?: string;
  onDevPlay?: () => void; // Thêm prop cho dev mode
}

const Spinner = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} border-3 border-current border-t-transparent rounded-full animate-spin`}></div>
);

const RegistrationForm: React.FC<Props> = ({ onSubmit, isLoading, serverError, onDevPlay }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    date: '',
    returnDate: '',
    pax: '1',
    code_booking: ''
  });

  const [locations, setLocations] = useState<string[]>([]);
  const [isFetchingSetup, setIsFetchingSetup] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof UserData, string>>>({});
  
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkPhone, setCheckPhone] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckPrizeResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSetup = async () => {
      try {
        const data = await getSetupData();
        if (isMounted && data?.locations) {
          setLocations(data.locations);
        }
      } catch (err) {
        console.error("Lỗi tải SETUP:", err);
      } finally {
        if (isMounted) setIsFetchingSetup(false);
      }
    };
    loadSetup();
    return () => { isMounted = false; };
  }, []);

  const validate = () => {
    const newErrors: Partial<Record<keyof UserData, string>> = {};
    const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
    const paxNum = parseInt(formData.pax);

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Vui lòng nhập họ tên đầy đủ';
    }
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.location) {
      newErrors.location = 'Vui lòng chọn địa điểm';
    }
    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày đi';
    }
    if (!formData.returnDate) {
      newErrors.returnDate = 'Vui lòng chọn ngày trở về';
    } else if (formData.date && new Date(formData.returnDate) < new Date(formData.date)) {
      newErrors.returnDate = 'Ngày về không được trước ngày đi';
    }
    if (isNaN(paxNum) || paxNum < 1) {
      newErrors.pax = 'Số khách tối thiểu là 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        pax: parseInt(formData.pax),
        code_booking: formData.code_booking.trim()
      });
    }
  };

  const handleCheckPrize = async () => {
    if (!checkPhone || checkPhone.length < 9) return;
    setIsChecking(true);
    setCheckResult(null);
    try {
      const res = await checkPrize(checkPhone);
      setCheckResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    try {
      if ('showPicker' in input && typeof input.showPicker === 'function') {
        input.showPicker();
      }
    } catch (err) {
      console.warn("showPicker not supported or failed:", err);
    }
  };

  const getLocIcon = (name: string) => {
    const icons = ['🌴', '⛰️', '🌊', '🌲', '⛵', '🏮', '🏯', '🏜️', '🌸'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return icons[hash % icons.length];
  };

  const baseInputClass = "w-full px-5 py-3.5 rounded-xl border-2 transition-all font-semibold outline-none bg-white text-slate-800";
  const labelClass = "block text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 transition-all duration-500 hover:shadow-blue-100 relative">
      
      {isFetchingSetup && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center space-y-4">
          <Spinner className="w-10 h-10 text-blue-600" />
          <p className="text-blue-600 font-black text-[0.6rem] uppercase tracking-[0.2em] animate-pulse">Đang tải dữ liệu...</p>
        </div>
      )}

      <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80)' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
          <div>
            <h2 className="text-white text-2xl font-extrabold tracking-tight leading-tight">Du lịch bốn phương</h2>
            <p className="text-blue-300 font-bold text-[0.6rem] uppercase tracking-widest mt-1">Nhận quà liền tay - Thoả sức đi xa</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {serverError && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-pulse">
             ⚠️ {serverError}
          </div>
        )}

        <div>
          <label className={labelClass}>Họ và tên</label>
          <input
            type="text"
            disabled={isLoading}
            className={`${baseInputClass} ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500'}`}
            placeholder="Nguyễn Văn A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && <p className="text-red-500 text-[0.65rem] mt-1 font-bold ml-1">{errors.name}</p>}
        </div>

        <div>
          <label className={labelClass}>Số điện thoại</label>
          <input
            type="tel"
            disabled={isLoading}
            className={`${baseInputClass} ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500'}`}
            placeholder="09xx xxx xxx"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          {errors.phone && <p className="text-red-500 text-[0.65rem] mt-1 font-bold ml-1">{errors.phone}</p>}
        </div>

        <div>
          <label className={labelClass}>Bạn muốn đi đâu?</label>
          <div className="relative">
            <select
              disabled={isFetchingSetup || isLoading}
              className={`${baseInputClass} appearance-none disabled:opacity-50 ${errors.location ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500'}`}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            >
              <option value="">{isFetchingSetup ? 'Đang tải địa điểm...' : 'Chọn địa điểm...'}</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>{getLocIcon(loc)} {loc}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.location && <p className="text-red-500 text-[0.65rem] mt-1 font-bold ml-1">{errors.location}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ngày đi</label>
            <input
              type="date"
              disabled={isLoading}
              style={{ colorScheme: 'light' }}
              className={`${baseInputClass} cursor-pointer text-sm ${errors.date ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500'}`}
              value={formData.date}
              onClick={handleDateClick}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            {errors.date && <p className="text-red-500 text-[0.65rem] mt-1 font-bold ml-1">{errors.date}</p>}
          </div>

          <div>
            <label className={labelClass}>Ngày về</label>
            <input
              type="date"
              disabled={isLoading}
              style={{ colorScheme: 'light' }}
              className={`${baseInputClass} cursor-pointer text-sm ${errors.returnDate ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500'}`}
              value={formData.returnDate}
              onClick={handleDateClick}
              onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            />
            {errors.returnDate && <p className="text-red-500 text-[0.65rem] mt-1 font-bold ml-1">{errors.returnDate}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Số khách</label>
          <input
            type="number"
            min="1"
            disabled={isLoading}
            className={`${baseInputClass} ${errors.pax ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-blue-500'}`}
            value={formData.pax}
            onChange={(e) => setFormData({ ...formData, pax: e.target.value })}
          />
          {errors.pax && <p className="text-red-500 text-[0.65rem] mt-1 font-bold ml-1">{errors.pax}</p>}
        </div>

        <div>
          <label className={labelClass}>Mã booking</label>
          <input
            type="text"
            disabled={isLoading}
            className={`${baseInputClass} border-slate-300 focus:border-blue-500`}
            placeholder="Nhập mã booking"
            value={formData.code_booking}
            onChange={(e) => setFormData({ ...formData, code_booking: e.target.value })}
          />
        </div>

        <div className="space-y-3 pt-3">
          <button
            type="submit"
            disabled={isLoading || isFetchingSetup}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl shadow-xl shadow-blue-100 transform transition active:scale-[0.98] disabled:opacity-80 flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <>
                <Spinner className="w-6 h-6" />
                <span>ĐANG XỬ LÝ...</span>
              </>
            ) : (
              <>
                <span>THỬ VẬN MAY</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </>
            )}
          </button>

          {/* NÚT CHƠI THỬ (CHỈ HIỆN KHI CÓ onDevPlay) */}
          {onDevPlay && (
            <button
              type="button"
              onClick={onDevPlay}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              <span className="text-xl">🛠️</span> CHƠI THỬ (DEV MODE)
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCheckModal(true)}
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-50/50 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <span className="uppercase tracking-wide">KIỂM TRA GIẢI THƯỞNG</span>
          </button>
        </div>
      </form>

      {showCheckModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in fade-in duration-300">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-wider text-sm">Kiểm tra quà tặng</h3>
              <button 
                disabled={isChecking}
                onClick={() => {setShowCheckModal(false); setCheckResult(null); setCheckPhone('');}} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {!checkResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nhập số điện thoại của bạn</label>
                    <input
                      type="tel"
                      disabled={isChecking}
                      className="w-full px-5 py-4 rounded-xl border-2 border-slate-300 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg"
                      placeholder="09xx xxx xxx"
                      value={checkPhone}
                      onChange={(e) => setCheckPhone(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleCheckPrize}
                    disabled={isChecking || checkPhone.length < 9}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all disabled:opacity-80 flex items-center justify-center gap-3"
                  >
                    {isChecking ? (
                      <>
                        <Spinner className="w-5 h-5" />
                        <span>ĐANG KIỂM TRA...</span>
                      </>
                    ) : 'XÁC NHẬN'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </div>
                    <p className="text-slate-800 font-bold text-lg mb-1">{checkResult.name || 'Khách hàng'}</p>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{checkResult.phone}</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 max-h-48 overflow-y-auto border border-slate-200">
                    {checkResult.status === 'has_prize' && checkResult.prizes ? (
                      <div className="space-y-3">
                        {checkResult.prizes.map((p, i) => (
                          <div key={i} className="flex flex-col border-b border-slate-200 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                            <span className="text-blue-600 font-black text-sm uppercase">{p.prize}</span>
                            <span className="text-slate-400 text-[0.6rem] font-bold mt-1">🕒 {p.time}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-500 font-bold text-sm italic">{checkResult.message}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {setCheckResult(null); setCheckPhone('');}}
                    className="w-full py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all"
                  >
                    KIỂM TRA SỐ KHÁC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;
