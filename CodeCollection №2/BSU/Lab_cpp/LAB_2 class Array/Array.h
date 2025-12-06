#ifndef ARRAY_H
#define ARRAY_H

#include <iostream>
#include <utility>

template <typename T>
class Array {
private:
    size_t capacity;
    size_t size;
    T* arr;

public:
    Array(size_t capacity);
    Array(const Array& other);
    ~Array();

    void add(T value);
    T& operator[](size_t index);
    Array& operator=(const Array& other);
    Array operator+(const Array& other) const;
    void insertionSort();
    void selectionSort();
    void bubbleSort();
    long binarySearch(const T& value) const;
    size_t getSize() const;
    void print() const;

    friend std::ostream& operator<<(std::ostream& os, const Array<T>& array) {
        for (size_t i = 0; i < array.size; ++i) {
            if (i > 0) {
                os << ' ';
            }
            os << array.arr[i];
        }
        return os;
    }

    friend std::istream& operator>>(std::istream& is, Array<T>& array) {
        array.size = 0;
        for (size_t i = 0; i < array.capacity; ++i) {
            T value;
            if (!(is >> value)) {
                break;
            }
            array.add(value);
        }
        return is;
    }
};

#include "Array.cpp"

#endif
