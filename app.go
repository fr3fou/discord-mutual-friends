package main

import (
	"context"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"strings"
)

// App struct
type App struct {
	ctx            context.Context
	fetchingCancel context.CancelFunc
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

func (a *App) Start(token string) (User, error) {
	ctx, cancel := context.WithCancel(a.ctx)
	a.fetchingCancel = cancel
	me, ch, err := buildGraph(ctx, strings.TrimSpace(token))
	if err != nil {
		return User{}, err
	}

	go func() {
		for event := range ch {
			runtime.EventsEmit(a.ctx, "relationshipFetched", event)
		}
	}()

	return me, nil
}

func (a *App) Stop() {
	if a.fetchingCancel != nil {
		a.fetchingCancel()
	}
}
