import { useState, useEffect, useRef } from "react";
import { db } from "../services/config";
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import "./Chat.css";

export const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [name, setName] = useState("");
    const [validUser, setValidUser] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "messages"), (snapshot) => {
            const messagesData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(msg => msg.timestamp)
                .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleUsername = (e) => setName(e.target.value);

    const enterChat = (e) => {
        e.preventDefault();
        if (name.trim()) {
            setValidUser(true);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() && name.trim()) {
            try {
                await addDoc(collection(db, "messages"), {
                    text: newMessage.trim(),
                    user: name.trim(),
                    timestamp: serverTimestamp()
                });
                setNewMessage("");
            } catch (error) {
                console.error("Error al enviar mensaje:", error);
            }
        }
    };

    const getUserColor = (username) => {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 70%)`;
    };

    if (!validUser) {
        return (
            <div className="welcome_container">
                <h1>Bienvenido al Chat 🌍</h1>
                <form onSubmit={enterChat} className="form_name_container">
                    <input
                        type="text"
                        onChange={handleUsername}
                        placeholder="Ingresa tu nombre para comenzar"
                        required
                    />
                    <button type="submit">Entrar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="chat_wrapper">
            <div className="chat_messages">
                {messages.map((message) => (
                    <div key={message.id} className="message">
                        <strong style={{ color: getUserColor(message.user) }}>
                            {message.user}:
                        </strong>{" "}
                        {message.text}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="chat_input_form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    required
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
};
