import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiImage, FiPlus, FiSave, FiSearch, FiShield, FiTrash2, FiUploadCloud, FiUsers, FiX } from "react-icons/fi";
import { API_URL } from "../../api/axios";
import api from '../../api/axios';
import {errorText} from '../Reception/desk';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addUser, deleteUser, fetchUsers } from "../../features/users/usersThunks";

type AdminUser = {
  id: string | number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  has_workspace?: boolean;
  staff_type?: string | null;
  monthly_salary?: number | string;
  profile_picture?: string | null;
  active?: boolean;
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  barber: "Stylist",
  receptionist: "Reception",
  support: "Support staff",
  customer: "Customer",
};

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.users);
  const users = (list || []) as AdminUser[];
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("barber");
  const [staffType,setStaffType]=useState('cleaner');
  const [monthlySalary,setMonthlySalary]=useState('');
  const [password, setPassword] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [salaryDrafts,setSalaryDrafts]=useState<Record<string,string>>({});
  const [salarySaving,setSalarySaving]=useState<string|number|null>(null);
  const [salaryError,setSalaryError]=useState('');
  const [credentialDrafts,setCredentialDrafts]=useState<Record<string,{phone:string;password:string}>>({});
  const [credentialSaving,setCredentialSaving]=useState<string|number|null>(null);
  const [activationSaving,setActivationSaving]=useState<string|number|null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);
  useEffect(()=>setSalaryDrafts(current=>Object.fromEntries(users.filter(user=>user.role==='receptionist'||user.role==='support').map(user=>[String(user.id),current[String(user.id)]??String(user.monthly_salary||'')]))),[users]);
  useEffect(()=>setCredentialDrafts(current=>Object.fromEntries(users.filter(user=>user.role==='barber'||user.role==='receptionist').map(user=>[String(user.id),current[String(user.id)]??{phone:user.phone||'',password:''}]))),[users]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => `${user.name} ${user.phone || ''} ${user.email || ''} ${user.role} ${user.staff_type || ''}`.toLowerCase().includes(normalized));
  }, [query, users]);

  const counts = useMemo(() => ({
    total: users.length,
    barbers: users.filter((user) => user.role === "barber").length,
    reception: users.filter((user) => user.role === "receptionist").length,
    support: users.filter((user) => user.role === "support").length,
    admins: users.filter((user) => user.role === "admin").length,
  }), [users]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setRole("barber");
    setStaffType('cleaner');
    setMonthlySalary('');
    setPassword("");
    setProfilePictureFile(null);
    setPreview(null);
    setShowForm(false);
  };

  const handleAddUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("role", role);
    formData.append("password", password);
    formData.append('staffType',staffType);
    formData.append('monthlySalary',monthlySalary || '0');
    if (profilePictureFile) formData.append("profilePicture", profilePictureFile);

    try {
      await dispatch(addUser(formData)).unwrap();
      resetForm();
    } catch {
      // The slice keeps the server error visible above the list.
    }
  };

  const handleFileChange = (file: File | null) => {
    setProfilePictureFile(file);
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const saveSalary=async(member:AdminUser)=>{setSalarySaving(member.id);setSalaryError('');try{await api.put(`/admin/users/${member.id}/monthly-salary`,{monthlySalary:salaryDrafts[String(member.id)]||'0'});await dispatch(fetchUsers());}catch(e){setSalaryError(errorText(e));}finally{setSalarySaving(null);}};
  const saveCredentials=async(member:AdminUser)=>{setCredentialSaving(member.id);setSalaryError('');try{const draft=credentialDrafts[String(member.id)]||{phone:'',password:''};await api.put(`/admin/users/${member.id}/credentials`,draft);setCredentialDrafts(current=>({...current,[String(member.id)]:{phone:draft.phone,password:''}}));await dispatch(fetchUsers());}catch(e){setSalaryError(errorText(e));}finally{setCredentialSaving(null);}};
  const setActive=async(member:AdminUser,active:boolean)=>{setActivationSaving(member.id);setSalaryError('');try{await api.put(`/admin/users/${member.id}/active`,{active});await dispatch(fetchUsers());}catch(e){setSalaryError(errorText(e));}finally{setActivationSaving(null);}};

  return (
    <section className="admin-module-view">
      <header className="admin-module-header">
        <div>
          <p className="admin-eyebrow">YOUR TEAM</p>
          <h2 className="admin-module-title">Staff</h2>
          <p className="admin-module-subtitle">Add staff, change their sign-in details, and turn accounts on or off.</p>
        </div>
        <button className="admin-primary-button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? <FiX /> : <FiPlus />} <span>{showForm ? "Close form" : "Add team member"}</span>
        </button>
      </header>

      <div className="admin-module-stats">
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon indigo"><FiUsers /></span><div><small>Total team</small><strong>{counts.total}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon purple"><FiCheckCircle /></span><div><small>Stylists</small><strong>{counts.barbers}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon orange"><FiShield /></span><div><small>Reception</small><strong>{counts.reception}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon green"><FiUsers /></span><div><small>Support staff</small><strong>{counts.support}</strong></div></div>
        <div className="admin-stat-mini"><span className="admin-stat-mini-icon green"><FiShield /></span><div><small>Admins</small><strong>{counts.admins}</strong></div></div>
      </div>

      {showForm && (
        <form className="admin-form-panel" onSubmit={handleAddUser}>
          <div className="admin-form-heading"><div><p className="admin-card-kicker">NEW STAFF MEMBER</p><h3>Add staff</h3></div><span className="admin-form-note">Cleaners and washers are staff records only. They cannot sign in.</span></div>
          <div className="admin-form-grid">
            <label className="admin-field"><span>Full name</span><input className="admin-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Daniel Bekele" required /></label>
            <label className="admin-field"><span>Role</span><select className="admin-input" value={role} onChange={(event) => setRole(event.target.value)}><option value="barber">Stylist</option><option value="receptionist">Reception</option><option value="support">Support staff</option></select></label>
            {role==='support'&&<label className="admin-field"><span>Support role</span><select className="admin-input" value={staffType} onChange={event=>setStaffType(event.target.value)}><option value="cleaner">Cleaner</option><option value="washer">Washer</option><option value="other">Other</option></select></label>}
            {role!=='support'&&<label className="admin-field"><span>Phone number</span><input className="admin-input" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0912345678" required /></label>}
            {role!=='support'&&<label className="admin-field"><span>First password</span><input className="admin-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Make a password" required /></label>}
            {role!=='barber'&&<label className="admin-field"><span>Monthly salary (ETB)</span><input className="admin-input" type="number" min="0" step="0.01" inputMode="decimal" value={monthlySalary} onChange={event=>setMonthlySalary(event.target.value)} placeholder="Optional" /><small>This is used when you make monthly payroll.</small></label>}
          </div>
          <div className="admin-upload-row">
            <label className="admin-upload-box" htmlFor="profilePicture"><FiUploadCloud /><span>{profilePictureFile ? profilePictureFile.name : "Add a photo"}</span><small>Optional · PNG or JPG</small></label>
            <input id="profilePicture" type="file" accept="image/*" className="admin-file-input" onChange={(event) => handleFileChange(event.target.files?.[0] || null)} />
            {preview ? <img className="admin-upload-preview" src={preview} alt="Profile preview" /> : <span className="admin-upload-placeholder"><FiImage /></span>}
          </div>
          <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={resetForm}>Cancel</button><button type="submit" className="admin-primary-button"><FiPlus /> Save team member</button></div>
        </form>
      )}

      <section className="admin-module-card">
        <div className="admin-module-toolbar"><div><p className="admin-card-kicker">ALL STAFF</p><h3>Your team</h3></div><label className="admin-search-box"><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find staff" /></label></div>
        {loading && <div className="admin-inline-state">Loading team members…</div>}
        {error && <div className="admin-inline-error">{typeof error === "string" ? error : "Unable to load team members."}</div>}
        {salaryError&&<div className="admin-inline-error">{salaryError}</div>}
        {!loading && !filteredUsers.length && <div className="admin-empty-state">No staff match this search.</div>}
        <div className="admin-record-list">
          {filteredUsers.map((member) => (
            <div className="admin-record-row" key={member.id}>
              <div className="admin-record-main"><div className="admin-avatar admin-avatar-medium">{member.profile_picture ? <img src={`${API_URL}${member.profile_picture}`} alt="" /> : member.name?.slice(0, 1)}</div><div><strong>{member.name}</strong><span>{member.has_workspace===false?`${member.staff_type || 'Support'} · no sign-in page`:member.phone || member.email || 'No sign-in detail'}</span></div></div>
              <span className={`admin-role-pill ${member.role}`}>{roleLabels[member.role] || member.role}</span>
              <span className="admin-row-status"><i className={member.active===false?'is-inactive':''}/> {member.active===false?'Turned off':member.has_workspace===false?'No sign-in page':'Active'}</span>
              {(member.role==='barber'||member.role==='receptionist')&&<details className="admin-team-login"><summary>Change sign-in</summary><div><input className="admin-input" aria-label={`Phone number for ${member.name}`} type="tel" inputMode="tel" value={credentialDrafts[String(member.id)]?.phone||''} placeholder="0912345678" onChange={event=>setCredentialDrafts(current=>({...current,[String(member.id)]:{...(current[String(member.id)]||{password:''}),phone:event.target.value}}))}/><input className="admin-input" aria-label={`New password for ${member.name}`} type="password" minLength={8} value={credentialDrafts[String(member.id)]?.password||''} placeholder="New password (optional)" onChange={event=>setCredentialDrafts(current=>({...current,[String(member.id)]:{...(current[String(member.id)]||{phone:''}),password:event.target.value}}))}/><button className="admin-secondary-button" disabled={credentialSaving!==null} onClick={()=>void saveCredentials(member)}><FiSave/>{credentialSaving===member.id?'Saving…':'Save sign-in'}</button></div></details>}
              {(member.role==='receptionist'||member.role==='support')&&<div className="admin-team-salary"><label><span>Monthly salary</span><input className="admin-input" type="number" min="0" step="0.01" inputMode="decimal" value={salaryDrafts[String(member.id)]??''} onChange={event=>setSalaryDrafts(current=>({...current,[String(member.id)]:event.target.value}))}/></label><button className="admin-secondary-button" disabled={salarySaving!==null} onClick={()=>void saveSalary(member)}><FiSave/>{salarySaving===member.id?'Saving…':'Save'}</button></div>}
              {member.role!=='admin'&&<button className="admin-secondary-button" disabled={activationSaving!==null} onClick={()=>void setActive(member,member.active===false)}>{activationSaving===member.id?'Saving…':member.active===false?'Activate':'Deactivate'}</button>}
              <button className="admin-danger-icon" title={`Remove ${member.name}`} onClick={() => dispatch(deleteUser(String(member.id)))}><FiTrash2 /></button>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export default UserManagement;
