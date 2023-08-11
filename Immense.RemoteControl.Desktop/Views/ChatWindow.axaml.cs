﻿using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Markup.Xaml;
using Immense.RemoteControl.Desktop.ViewModels;
using System;
using System.Threading.Tasks;

namespace Immense.RemoteControl.Desktop.Views;

public partial class ChatWindow : Window
{
    public ChatWindow()
    {
        InitializeComponent();
    }

    private ChatWindowViewModel? ViewModel => DataContext as ChatWindowViewModel;

    private void ChatWindow_Closed(object? sender, System.EventArgs e)
    {
        Environment.Exit(0);
    }

    private async void ChatWindow_KeyUp(object? sender, Avalonia.Input.KeyEventArgs e)
    {
        if (e.Key == Avalonia.Input.Key.Enter &&
            DataContext is ChatWindowViewModel viewModel)
        {
            await viewModel.SendChatMessage();
        }
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);

        Closed += ChatWindow_Closed;
        Opened += ChatWindow_Opened;

        TitleBanner.PointerPressed += TitleBanner_PointerPressed;
        InputTextBox.KeyUp += ChatWindow_KeyUp;
        MessagesListBox.Loaded += MessageListBox_Loaded;
    }

    private void ChatWindow_Opened(object? sender, EventArgs e)
    {
        Topmost = false;
    }

    private async void MessageListBox_Loaded(object? sender, RoutedEventArgs e)
    {
        // Allows listbox height to adjust to content before scrolling the scrollviewer.
        await Task.Delay(1);
        // TODO: Replace with ScrollToEnd when implemented.
        MessagesScrollViewer.Offset = new Vector(0, MessagesListBox.Bounds.Height);
    }


    private void TitleBanner_PointerPressed(object? sender, Avalonia.Input.PointerPressedEventArgs e)
    {
        if (e.GetCurrentPoint(this).Properties.PointerUpdateKind == Avalonia.Input.PointerUpdateKind.LeftButtonPressed)
        {
            BeginMoveDrag(e);
        }
    }
}
