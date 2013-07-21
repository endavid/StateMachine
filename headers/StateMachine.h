// Copyright (C) 2012 David Gavilan Ruiz
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * @file StateMachine.h
 * @author David Gavilan
 * @date 2013/7/20
 */
#ifndef CORE_STATE_MACHINE_H_
#define CORE_STATE_MACHINE_H_

#include <stddef.h>
#include "core_def.h"


CORE_NS_BEGIN

/**
 *  How to create a StateMachine manually:
 *
 *  class MyMachine : public core::StateMachine<MyMachine>
 *  {
 *      MyMachine() : Super(&MyMachine::InitialState) {}
 *      void InitialState(const float time_ms) {
 *        if (some_condition) {
 *          SwitchTo(&MyMachine::SomeOtherState);
 *        }
 *      }
 *      void SomeOtherState(const float time_ms) {}
 *      // optional stuff to be executed every frame
 *      //virtual void CommonUpdate(const float time_ms) {}
 *  };
 *
 *  MyMachine machine;
 *  // call Update every frame:
 *  machine.Update(time);
 *
 * You can also use yaml2cpp.rb to autogenerate the skeleton code
 * from a YAML file. 
 * @see https://github.com/endavid/StateMachine
 */
template <class T>
class StateMachine {
protected:
    typedef void (T::*State)(const float);
    typedef StateMachine<T> Super;
    
public:
    StateMachine(State initialState)
    : m_nextState(initialState)
    , m_currentState(NULL)
    {}
    // To be executed every frame
    void Update(const float time_ms)
    {
        CommonUpdate(time_ms);
        Next();
        if (m_currentState != NULL) {
            (reinterpret_cast<T*>(this)->*m_currentState)(time_ms);
        }
    }
    
protected:
    virtual void CommonUpdate(const float time_ms) {}
    inline State GetCurrentState() const { return m_currentState; }

    void SwitchTo(State nextState) {
        m_nextState = nextState;
    }
    
private:
    void Next() {
        if (m_nextState != NULL) {
            m_currentState = m_nextState;
            m_nextState = NULL;
        }
    }
    
private:
    State m_nextState;
    State m_currentState;
};

CORE_NS_END

#endif // CORE_STATE_MACHINE_H_
