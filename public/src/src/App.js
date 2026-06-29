import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function PMTool() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);

  const projects = [
    'Utzmannsbach', 'Kastellstraße 86', 'Amberg', 'Haus am Berg', 'Haus Amberg',
    'Halle (Wittenberger)', 'Lindenfels', 'Bad Schwalbach', 'Castelstraße 86',
    'Gleditschstraße 32', 'Plasteblock 683',
    'Marketing & Social Media', 'Admin & Büro', 'Auto & Fahrtkosten',
    'Studio Messberger', 'KI Workshop', 'Plaza Cleaning', 'Sonstiges'
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsLast: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Laden: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    if (!title.trim()) {
      alert('Bitte Aufgabe eintragen!');
      return;
    }

    try {
      const { error } = await supabase.from('tasks').insert([
        {
          title: title.trim(),
          project: project || null,
          due_date: dueDate || null,
          done: false
        }
      ]);

      if (error) throw error;
      setTitle('');
      setProject('');
      setDueDate('');
      loadTasks();
    } catch (error) {
      alert('Fehler: ' + error.message);
    }
  }

  async function toggleTask(id, currentDone) {
    try {
      if (!currentDone) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').update({ done: false }).eq('id', id);
        if (error) throw error;
      }
      loadTasks();
    } catch (error) {
      alert('Fehler: ' + error.message);
    }
  }

  async function deleteTask(id) {
    if (!confirm('Aufgabe löschen?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      loadTasks();
    } catch (error) {
      alert('Fehler: ' + error.message);
    }
  }

  const openTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>📋 Projekt Manager</h1>

      <div style={styles.statsBox}>
        <div><strong>Offene Aufgaben:</strong> {openTasks.length}</div>
        <div><strong>Erledigt:</strong> {doneTasks.length}</div>
      </div>

      <div style={styles.inputPanel}>
        <h2 style={styles.h2}>➕ Neue Aufgabe</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Aufgabe</label>
          <input
            type="text"
            placeholder="Was muss getan werden?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Projekt</label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            style={styles.input}
          >
            <option value="">-- Wählen --</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Fällig am</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={styles.input}
          />
        </div>

        <button onClick={addTask} style={styles.buttonPrimary}>
          Aufgabe hinzufügen
        </button>
      </div>

      <div style={styles.listPanel}>
        <h2 style={styles.h2}>📌 Aufgaben ({openTasks.length})</h2>

        {loading ? (
          <p style={{ color: '#999' }}>Lädt...</p>
        ) : openTasks.length === 0 ? (
          <p style={{ color: '#999' }}>Keine offenen Aufgaben! 🎉</p>
        ) : (
          <div>
            {openTasks
              .sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
              })
              .map((task) => (
                <div key={task.id} style={styles.taskItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                    {task.project && (
                      <div style={styles.taskMeta}>
                        Projekt: <strong>{task.project}</strong>
                      </div>
                    )}
                    {task.due_date && (
                      <div style={styles.taskMeta}>
                        Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => toggleTask(task.id, task.done)}
                      style={styles.buttonSuccess}
                    >
                      ✓ Fertig
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={styles.buttonDanger}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fff',
    color: '#000'
  },
  h1: {
    color: '#1E5BA8',
    textAlign: 'center',
    marginBottom: '30px'
  },
  h2: {
    color: '#1E5BA8',
    fontSize: '18px',
    marginBottom: '15px',
    borderBottom: '2px solid #1E5BA8',
    paddingBottom: '10px'
  },
  statsBox: {
    backgroundColor: '#f0f8ff',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '5px',
    borderLeft: '4px solid #1E5BA8',
    color: '#000'
  },
  inputPanel: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    marginBottom: '30px',
    borderRadius: '5px',
    borderLeft: '5px solid #1E5BA8'
  },
  listPanel: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '5px',
    borderLeft: '5px solid #1E5BA8'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#000'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    fontFamily: 'Arial, sans-serif',
    color: '#000',
    backgroundColor: '#fff'
  },
  buttonPrimary: {
    width: '100%',
    padding: '10px
