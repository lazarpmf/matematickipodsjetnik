import type { Metadata } from 'next';
import TasksClient from './TasksClient';

export const metadata: Metadata = {
  title: 'Zadaci',
  description:
    'Otvori zadatak kodom ili pogledaj javne zadatke Matematičkog podsjetnika.',
};

export default function TasksPage() {
  return <TasksClient />;
}
