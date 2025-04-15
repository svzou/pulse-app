# Design Document

> Written by: Saanvi Arora, Rithvik Srinivas, Connor Whitlow, and Sophia Zou for COMP 426: Modern Web Programming at UNC-Chapel Hill.

## Feature Plan

### Feature 1: Post/Draft Workouts

**Description:** This feature allows users to create and share workout posts on the platform. Users can document their workouts by including important metrics such as duration and total volume lifted (in pounds) and attaching an image of their workout or results. Each post will display the user's avatar, name, and username tag, similar to social media platforms like Instagram. You can additionally add hashtags to your post.


**User(s):** Fitness enthusiasts of all levels who want to share their workout progress, routines and achievements with their friends, family, or like-minded people.


**Purpose:** This feature allows users to document their fitness journey, receive feedback and encouragement from the community, and maintain accountability by publicly sharing their workouts. It also serves as inspiration for other users looking for workout ideas.


**Technical Notes:** \
Frontend:
- Create a post form component with input fields for workout details
- Image upload capability with preview
- Form validation for required fields
- Post card component to display workout posts in feed
- Modal or dedicated page for post creation
- Avatar and user information display

Backend/Database:
- Supabase Auth for user authentication and session management
- Workouts table in Supabase with foreign key to auth.users
- Supabase Storage buckets for workout images with references in the Workouts table
- Fields for workout metrics (duration, volume, etc.)



### Feature 2: Exercise Library

**Description:**  Each exercise has a dedicated page to describing the exercise, which includes the type of equipment required, the primary and secondary muscle groups the exercise targets, and an image depicting proper form with visually highlights of the targeted muscle groups. The page also features statistical charts that display weight progression per session over a 12 week, 6 months, or 1 year time span. 


**User(s):**  Gym enthusiasts that enjoy tracking progress made on a specific exercise.


**Purpose:** The purpose of this feature is to educate individuals on the muscles this exercise targets and a visual representation to give a reminder to users on what the exercise is. For example, if the user forgets exactly what “cable flies” is, they can quickly look up the exercise in the app and find a clear image of how it is performed. It also helps motivate users by displaying their historical progress and provides a form of accountability to encourage consistency.


**Technical Notes:** \
Frontend:
- A graph of the history of the weight lifted per session with a dropdown that allows users to switch time ranges between 12 weeks, 6 months, and 1 year
- A text description describing the exercise along with a picture of proper form for the exercise to the right 

Backend: 
- Use Supabase Storage buckets to store exercise image
- Create a workout_stats table which stores the user id, exercise id, date, weight used, reps, sets, etc.
- Create exercise table which stores the different kinds of exercises, muscle groups targeted etc


### Feature 3: Workout Log page

**Description:** This feature enables users to log, view, and reflect on individual workout sessions in a structured format. Each workout entry includes detailed information such as exercise names, sets, weight, and reps. The top of the page includes a workout summary written by the user that resembles a social media card, showing the date, duration, total volume lifted, and Twitter-like posts. 


**User(s):** Lifters, athletes, or general gym-goers who want to record their workouts in detail and monitor performance across multiple sessions. It also serves users looking to document specific workouts for routine planning or future reference.


**Purpose:** This feature allows users to accurately track their strength training progress, review data, and gain insight into performance trends. By combining social interaction with personal data of tracking exercise logs, this page balances community engagement and goal tracking. 


**Technical Notes:** \
Frontend:
- Component to render a workout post
- Dynamic exercise log UI with collapsible sections per exercise
- Set input table showing set numbers, weights, reps

Backend:
- Supabase table: with workout logs with relation to authenticated users.
- Sub table with exercise entries with files such as exercise, workout, set, weight, reps
- Another supabase table: With workout_stats
- User_id, title, duration_minutes, description, date, etc.


### Feature 4: Viewing your profile


**Description:** The profile page represents the user’s own data in the app. It shows the user’s profile picture, username, follower/following counter, along with a row of recent past workout images at the top. Below that is a log of previous workouts with brief summaries of the workout revealing the user-inputted description of the workout, as well as the duration and volume of the workout. A chart shows the workout duration per month and a calendar highlights which days you were active in the past month. 


**User(s):** Anyone who wants to keep track of their workouts, see their progress over time, and be inspired by other users in the fitness community.


**Purpose:** This page helps the user stay motivated by showing their progress visually with data. Whether it's seeing how often you hit the gym, looking back at old workout posts, or sharing milestones with others, it’s a great way to stay consistent and engaged. The calendar feature allows you to see which days you have completed a workout in order to encourage a streak of consistency. The top row of pictures shows the 5 most recent workouts that include a picture, so you can visually keep track of physical changes or just further reinforce to yourself that you showed up. 



**Technical Notes:** \
Frontend:
- Profile header with avatar, username, followers/following, and optional bio
- An “edit profile” button
- Calendar component highlighting previous days worked out
- Monthly workout bar chart
  
Backend:
- Supabase table with User profile
- Supabase table with workouts and summaries
- Social relations like following and followers


### Feature 5: Badge display

**Description:** The Badge display system is a way to recognize and reward users based on their workout frequency and consistency. Badges and stars are displayed with different tiers (Bronze, Silver, Gold) corresponding to specific workout count milestones. Stars correspond to volume lifted and badges correspond to number of workouts completed. We might also include more types of badges for things like consistency, improvement etc 


**User(s):** Anyone who wants to display their badges can do so, and can choose what badges to display. Those who choose to keep it private can also have a tangible way of keeping track of their progress.


**Purpose:** The display of badges and stars are helpful to users as they are indicators of progress and can help in both motivation and status symbols- celebrating user dedication to their fitness journey.

**Technical Notes:** \
Frontend:
- Option to have the badge private or public 
- Displayed beneath the followers/ following line, next to avatar

Backend:
- Supabase table with badges, including the different types and tiers
- Supabase table with user badges, indicating if the user is displaying it or not by using the “displayed” boolean value


## Backend Database Schema
![supabase-schema-aomdacjzdfgueepwwsze (1)](https://github.com/user-attachments/assets/08dc719f-c8a5-4259-85a1-d2a55eec08af)



## High-Fidelity Prototype
[(https://www.figma.com/design/YitPmldXJdAzhB7ScDKOCC/Team-17-Pulse-Prototype?node-id=2-287&m=dev&t=traHt2sL6FLKvzqZ-1) 
