// Hardcoded workout data for the Workout page. No backend calls.
// Shapes follow the API's Workout and Set models.

export const EXERCISES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Push-ups",
  "Pull-ups",
  "Overhead Press",
  "Barbell Row",
  "Lunges",
  "Romanian Deadlift",
  "Leg Press",
  "Lat Pulldown",
  "Bicep Curl",
  "Tricep Dip",
  "Plank",
  "Hip Thrust",
  "Dumbbell Row",
  "Shoulder Press",
  "Leg Curl",
  "Calf Raise",
  "Incline Press",
];

// Workouts that exist when the page loads. Empty: the page starts with no workout.
// Workout: { workoutId, status: "IN_PROGRESS" | "COMPLETED", endTime, sets }
// Set:     { setId, workoutId, exercise, sets, reps, weightKg, date }
export const INITIAL_WORKOUTS = [];
