#include "Array.h"
#include <stdexcept>

template <typename T>
Array<T>::Array(size_t cap) : capacity(cap), size(0), arr(new T[cap]) {}

template <typename T>
Array<T>::Array(const Array& other) : capacity(other.capacity), size(other.size), arr(new T[other.capacity]) {
    for (size_t i = 0; i < size; ++i) {
        arr[i] = other.arr[i];
    }
}

template <typename T>
Array<T>::~Array() {
    delete[] arr;
}

template <typename T>
void Array<T>::add(T value) {
    if (size >= capacity) {
        return;
    }
    arr[size++] = value;
}

template <typename T>
T& Array<T>::operator[](size_t index) {
    if (index >= size) {
        throw std::out_of_range("Index out of range");
    }
    return arr[index];
}

template <typename T>
Array<T>& Array<T>::operator=(const Array& other) {
    if (this == &other) {
        return *this;
    }

    delete[] arr;
    capacity = other.capacity;
    size = other.size;
    arr = new T[capacity];
    for (size_t i = 0; i < size; ++i) {
        arr[i] = other.arr[i];
    }
    return *this;
}

template <typename T>
Array<T> Array<T>::operator+(const Array& other) const {
    Array result(size + other.size);
    for (size_t i = 0; i < size; ++i) {
        result.add(arr[i]);
    }
    for (size_t i = 0; i < other.size; ++i) {
        result.add(other.arr[i]);
    }
    return result;
}

template <typename T>
void Array<T>::insertionSort() {
    for (size_t i = 1; i < size; ++i) {
        T key = arr[i];
        long j = static_cast<long>(i) - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            --j;
        }
        arr[j + 1] = key;
    }
}

template <typename T>
void Array<T>::selectionSort() {
    for (size_t i = 0; i + 1 < size; ++i) {
        size_t minIndex = i;
        for (size_t j = i + 1; j < size; ++j) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        if (minIndex != i) {
            std::swap(arr[i], arr[minIndex]);
        }
    }
}

template <typename T>
void Array<T>::bubbleSort() {
    if (size < 2) {
        return;
    }
    for (size_t i = 0; i + 1 < size; ++i) {
        for (size_t j = 0; j + 1 < size - i; ++j) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
            }
        }
    }
}

template <typename T>
long Array<T>::binarySearch(const T& value) const {
    if (size == 0) {
        return -1;
    }
    size_t left = 0;
    size_t right = size - 1;
    while (left <= right) {
        size_t mid = left + (right - left) / 2;
        if (arr[mid] == value) {
            return static_cast<long>(mid);
        }
        if (arr[mid] < value) {
            left = mid + 1;
        } else {
            if (mid == 0) {
                break;
            }
            right = mid - 1;
        }
    }
    return -1;
}

template <typename T>
size_t Array<T>::getSize() const {
    return size;
}

template <typename T>
void Array<T>::print() const {
    std::cout << *this << std::endl;
}
