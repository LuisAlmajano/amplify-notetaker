import React, { useState, useEffect } from "react";

// GraphQL imports
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import { onCreateNote } from './graphql/subscriptions';

// Configure Amplify with React
import Amplify from "aws-amplify";
import awsconfig from "./aws-exports";
import { AmplifySignOut, withAuthenticator } from "@aws-amplify/ui-react";

import "./App.css";

Amplify.configure(awsconfig);

function App() {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await API.graphql(graphqlOperation(listNotes));
      setNotes(result.data.listNotes.items);
    };

    fetchData();
  }, []);

  const handleChangeNote = (e) => setNote(e.target.value);

  const hasExistingNote = () => {
    if (id) {
      // is the id a valid id?
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const input = { note };
    // Check if we have an existing note if so update it
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      // otherwise we create a new note
      const result = await API.graphql(graphqlOperation(createNote, { input }));
      const newNote = result.data.createNote;
      setNotes([...notes, newNote]);
      setNote("");
    }
  };

  const handleUpdateNote = async () => {
    const input = { id, note };
    const result = await API.graphql(graphqlOperation(updateNote, { input }));
    const updatedNote = result.data.updateNote;
    const index = notes.findIndex((note) => note.id === updatedNote.id);
    const updatedNotes = [
      ...notes.slice(0, index),
      updatedNote,
      ...notes.slice(index + 1),
    ];
    console.log("updatedNotes: ", updatedNotes);
    setNotes(updatedNotes);
    setNote("");
    setId("");
  };

  const handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const deletedNoteId = result.data.deleteNote.id;
    const updatedNotes = notes.filter((note) => note.id !== deletedNoteId);
    setNotes(updatedNotes);
  };

  const handleSetNote = ({ id, note }) => {
    setId(id);
    setNote(note);
  };

  return (
    <div className="container">
      <div className="header">
        <AmplifySignOut />
      </div>
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-1">Amplify Notetaker</h1>
        <form onSubmit={handleAddNote} className="mb3">
          <input
            type="text"
            className="pa2 f4"
            placeholder="Write your note"
            onChange={handleChangeNote}
            value={note}
          />
          <button className="pa2 f4" type="submit">
            {id ? "Update Note" : "Add Note"}
          </button>
        </form>
        {/* Notes List */}
        <div>
          {notes.map((item) => (
            <div key={item.id} className="flex items-center">
              <li onClick={() => handleSetNote(item)} className="list pa1 f3">
                {item.note}
              </li>
              <button
                onClick={() => handleDeleteNote(item.id)}
                className="bg-transparent bn f4"
              >
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
