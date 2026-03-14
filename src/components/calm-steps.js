"use client";

import { useState } from "react";
import SiteHeader from "./site-header";
import styles from "./calm-steps.module.css";

const FEELINGS = [
  {
    id: "good",
    emoji: "🙂",
    label: "Calm",
    message: "You seem steady. Keep the rhythm going with small, clear steps.",
  },
  {
    id: "uncertain",
    emoji: "😐",
    label: "Unsure",
    message: "Let’s slow down and make the next step feel easier.",
  },
  {
    id: "overwhelmed",
    emoji: "😣",
    label: "Overwhelmed",
    message: "It may help to lower stimulation and focus on one safe step.",
  },
  {
    id: "frustrated",
    emoji: "😡",
    label: "Frustrated",
    message: "A pause can help reduce pressure before trying again.",
  },
  {
    id: "distressed",
    emoji: "😭",
    label: "Distressed",
    message: "Start with comfort and safety. You do not have to solve everything at once.",
  },
];

const SUPPORT_OPTIONS = [
  "Sensory break",
  "Guided breathing",
  "Calming music",
  "Quiet space",
];

export default function CalmSteps() {
  const [selectedFeeling, setSelectedFeeling] = useState(FEELINGS[0]);

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.wrapper}>
        <div className={styles.hero}>
          <p className={styles.kicker}>CalmSteps</p>
          <h1>How do you feel?</h1>
          <p className={styles.description}>
            Choose the mood that feels closest right now. The app will suggest
            gentle calming options to help you reset.
          </p>
        </div>

        <div className={styles.feelingsGrid}>
          {FEELINGS.map((feeling) => (
            <button
              className={
                selectedFeeling.id === feeling.id
                  ? styles.activeFeeling
                  : styles.feeling
              }
              key={feeling.id}
              onClick={() => setSelectedFeeling(feeling)}
              type="button"
            >
              <span className={styles.emoji}>{feeling.emoji}</span>
              <span className={styles.feelingLabel}>{feeling.label}</span>
            </button>
          ))}
        </div>

        <section className={styles.supportPanel}>
          <div className={styles.selectedMood}>
            <span className={styles.selectedEmoji}>{selectedFeeling.emoji}</span>
            <div>
              <h2>{selectedFeeling.label}</h2>
              <p>{selectedFeeling.message}</p>
            </div>
          </div>

          <div className={styles.supportList}>
            {SUPPORT_OPTIONS.map((option) => (
              <article className={styles.supportCard} key={option}>
                <h3>{option}</h3>
                <p>
                  {option === "Sensory break"
                    ? "Step away from noise, bright light, or extra demands for a few minutes."
                    : null}
                  {option === "Guided breathing"
                    ? "Breathe in slowly for four counts, hold for four, and exhale for six."
                    : null}
                  {option === "Calming music"
                    ? "Play familiar, low-stimulation music that helps you settle."
                    : null}
                  {option === "Quiet space"
                    ? "Move to a calm corner where you feel safe and less overloaded."
                    : null}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
