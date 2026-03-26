"use client";
import React from "react";

export default function useToggleModal(initialValues: boolean = false) {
  const [isOpen, setIsOpen] = React.useState(initialValues);
  const toggleClick = () => setIsOpen(!isOpen);
  const toggleClose = () => setIsOpen(false);
  const toggleOpen = () => setIsOpen(true);
  return {
    isOpen,
    toggleClick,
    toggleClose,
    toggleOpen,
  };
}
