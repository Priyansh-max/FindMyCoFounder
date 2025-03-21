import { useState } from 'react';

const Task = ({ session, ideaId}) => {
    return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Team Tasks</h2>
      <div className="space-y-4">
        <div className="p-4 border border-border rounded-md bg-muted/50">
          <h3 className="font-medium">Publish a new task</h3>
          <textarea 
            className="w-full mt-2 p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Describe the task here..."
            rows={3}
          />
          <div className="mt-2">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Select Tag:</label>
            <div className="flex space-x-2">
              {['Major Task', 'Minor Task', 'Bug Fixes', 'Improvements', 'Optimization'].map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  onClick={() => console.log(`Selected tag: ${tag}`)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm">
              Publish Task
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Recent Tasks</h3>
          <div className="p-3 border-l-4 border-primary bg-muted/50 rounded-r-md">
            <p className="text-sm">Implement new authentication system.</p>
            <p className="text-xs text-muted-foreground mt-1">Assigned 2 days ago</p>
            <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">Major Task</span>
          </div>
          <div className="p-3 border-l-4 border-muted-foreground bg-muted/50 rounded-r-md">
            <p className="text-sm">Design new dashboard layout.</p>
            <p className="text-xs text-muted-foreground mt-1">Assigned 5 days ago</p>
            <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">Improvements</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Task;